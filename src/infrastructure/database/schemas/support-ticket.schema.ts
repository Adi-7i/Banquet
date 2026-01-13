import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document & {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

/**
 * Ticket Category
 */
export enum TicketCategory {
    BOOKING = 'BOOKING',
    PAYMENT = 'PAYMENT',
    ACCOUNT = 'ACCOUNT',
    DISPUTE = 'DISPUTE',
    GENERAL = 'GENERAL',
}

/**
 * Ticket Priority
 */
export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

/**
 * Ticket Status
 */
export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    WAITING_CUSTOMER = 'WAITING_CUSTOMER',
    WAITING_OWNER = 'WAITING_OWNER',
    ESCALATED = 'ESCALATED',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

/**
 * Ticket Message
 */
@Schema({ _id: false })
export class TicketMessage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    senderId: Types.ObjectId;

    @Prop({ type: String, enum: ['CUSTOMER', 'OWNER', 'ADMIN', 'SYSTEM'], required: true })
    senderType: string;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    attachments: string[];

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({ type: Boolean, default: false })
    isInternal: boolean;
}

/**
 * Ticket Resolution
 */
@Schema({ _id: false })
export class TicketResolution {
    @Prop({ type: String, required: true })
    summary: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    resolvedBy: Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    resolvedAt: Date;

    @Prop({ type: String })
    resolutionType?: string;
}

/**
 * Support Ticket Schema
 */
@Schema({ timestamps: true, collection: 'support_tickets' })
export class SupportTicket {
    @Prop({ type: String, unique: true, index: true })
    ticketNumber: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: String, enum: TicketCategory, required: true })
    category: TicketCategory;

    @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM })
    priority: TicketPriority;

    @Prop({ type: String, enum: TicketStatus, default: TicketStatus.OPEN, index: true })
    status: TicketStatus;

    @Prop({ type: String, required: true, maxlength: 200 })
    subject: string;

    @Prop({ type: String, required: true, maxlength: 5000 })
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'Booking' })
    relatedBookingId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Banquet' })
    relatedBanquetId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', index: true })
    assignedTo?: Types.ObjectId;

    @Prop({ type: [TicketMessage], default: [] })
    messages: TicketMessage[];

    @Prop({ type: TicketResolution })
    resolution?: TicketResolution;

    @Prop({ type: Date })
    firstResponseAt?: Date;

    @Prop({ type: Date })
    lastActivityAt?: Date;

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

// ==================================
// INDEXES
// ==================================

SupportTicketSchema.index({ status: 1, priority: -1, createdAt: 1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ category: 1, status: 1 });
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
