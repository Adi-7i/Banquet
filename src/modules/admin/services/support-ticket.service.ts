import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    SupportTicket,
    SupportTicketDocument,
    TicketStatus,
    TicketPriority,
    TicketCategory,
} from '@infrastructure/database/schemas/support-ticket.schema';
import { AuditLogService } from './audit-log.service';
import { AdminAction, EntityType } from '@infrastructure/database/schemas/admin-activity.schema';

/**
 * Support Ticket Service
 * Handles support ticket workflow
 */
@Injectable()
export class SupportTicketService {
    private readonly logger = new Logger(SupportTicketService.name);
    private ticketCounter = 0;

    constructor(
        @InjectModel(SupportTicket.name)
        private ticketModel: Model<SupportTicketDocument>,
        private readonly auditLogService: AuditLogService,
    ) { }

    /**
     * Create support ticket (customer/owner)
     */
    async createTicket(
        userId: string,
        dto: {
            category: TicketCategory;
            subject: string;
            description: string;
            priority?: TicketPriority;
            relatedBookingId?: string;
        },
    ): Promise<SupportTicketDocument> {
        const ticketNumber = await this.generateTicketNumber();

        const ticket = new this.ticketModel({
            ticketNumber,
            userId: new Types.ObjectId(userId),
            category: dto.category,
            subject: dto.subject,
            description: dto.description,
            priority: dto.priority || TicketPriority.MEDIUM,
            relatedBookingId: dto.relatedBookingId
                ? new Types.ObjectId(dto.relatedBookingId)
                : undefined,
            messages: [{
                senderId: new Types.ObjectId(userId),
                senderType: 'CUSTOMER',
                content: dto.description,
                timestamp: new Date(),
            }],
            lastActivityAt: new Date(),
        });

        await ticket.save();
        this.logger.log(`Ticket ${ticketNumber} created by user ${userId}`);
        return ticket;
    }

    /**
     * Get tickets for admin
     */
    async getTickets(
        page: number = 1,
        limit: number = 20,
        filters: {
            status?: TicketStatus;
            priority?: TicketPriority;
            category?: TicketCategory;
            assignedTo?: string;
        } = {},
    ): Promise<{ tickets: SupportTicketDocument[]; total: number }> {
        const query: any = { deletedAt: null };

        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;
        if (filters.category) query.category = filters.category;
        if (filters.assignedTo) query.assignedTo = new Types.ObjectId(filters.assignedTo);

        const [tickets, total] = await Promise.all([
            this.ticketModel
                .find(query)
                .populate('userId', 'email')
                .populate('assignedTo', 'email')
                .sort({ priority: -1, createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.ticketModel.countDocuments(query).exec(),
        ]);

        return { tickets, total };
    }

    /**
     * Assign ticket to admin
     */
    async assignTicket(
        ticketId: string,
        adminId: string,
        assigneeId: string,
        ipAddress?: string,
    ): Promise<SupportTicketDocument> {
        const ticket = await this.ticketModel.findById(ticketId).exec();
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.assignedTo = new Types.ObjectId(assigneeId);
        ticket.status = TicketStatus.IN_PROGRESS;
        ticket.lastActivityAt = new Date();
        await ticket.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.TICKET_ASSIGNED,
            entityType: EntityType.TICKET,
            entityId: ticketId,
            newState: { assignedTo: assigneeId },
            reason: 'Ticket assigned',
            ipAddress,
        });

        this.logger.log(`Ticket ${ticketId} assigned to ${assigneeId}`);
        return ticket;
    }

    /**
     * Update ticket status
     */
    async updateTicketStatus(
        ticketId: string,
        adminId: string,
        status: TicketStatus,
        ipAddress?: string,
    ): Promise<SupportTicketDocument> {
        const ticket = await this.ticketModel.findById(ticketId).exec();
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        const previousStatus = ticket.status;
        ticket.status = status;
        ticket.lastActivityAt = new Date();
        await ticket.save();

        this.logger.log(`Ticket ${ticketId} status changed to ${status}`);
        return ticket;
    }

    /**
     * Add message to ticket
     */
    async addMessage(
        ticketId: string,
        senderId: string,
        senderType: 'CUSTOMER' | 'OWNER' | 'ADMIN',
        content: string,
        isInternal: boolean = false,
    ): Promise<SupportTicketDocument> {
        const ticket = await this.ticketModel.findById(ticketId).exec();
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.messages.push({
            senderId: new Types.ObjectId(senderId),
            senderType,
            content,
            isInternal,
            timestamp: new Date(),
            attachments: [],
        });

        if (!ticket.firstResponseAt && senderType === 'ADMIN') {
            ticket.firstResponseAt = new Date();
        }

        ticket.lastActivityAt = new Date();
        await ticket.save();

        return ticket;
    }

    /**
     * Resolve ticket
     */
    async resolveTicket(
        ticketId: string,
        adminId: string,
        summary: string,
        ipAddress?: string,
    ): Promise<SupportTicketDocument> {
        const ticket = await this.ticketModel.findById(ticketId).exec();
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.status = TicketStatus.RESOLVED;
        ticket.resolution = {
            summary,
            resolvedBy: new Types.ObjectId(adminId),
            resolvedAt: new Date(),
        };
        ticket.lastActivityAt = new Date();
        await ticket.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.TICKET_RESOLVED,
            entityType: EntityType.TICKET,
            entityId: ticketId,
            newState: { status: TicketStatus.RESOLVED, resolution: summary },
            reason: 'Ticket resolved',
            ipAddress,
        });

        this.logger.log(`Ticket ${ticketId} resolved by ${adminId}`);
        return ticket;
    }

    /**
     * Get ticket statistics
     */
    async getTicketStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        avgResolutionTime: number;
    }> {
        const results = await this.ticketModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    open: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.OPEN] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.IN_PROGRESS] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.RESOLVED] }, 1, 0] } },
                },
            },
        ]).exec();

        return {
            total: results[0]?.total || 0,
            open: results[0]?.open || 0,
            inProgress: results[0]?.inProgress || 0,
            resolved: results[0]?.resolved || 0,
            avgResolutionTime: 0, // TODO: Calculate average resolution time
        };
    }

    private async generateTicketNumber(): Promise<string> {
        const count = await this.ticketModel.countDocuments().exec();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `TKT-${date}-${String(count + 1).padStart(5, '0')}`;
    }
}
