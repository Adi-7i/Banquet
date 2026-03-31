import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../api';

describe('api interceptors', () => {
    let mockApi: MockAdapter;

    beforeEach(() => {
        mockApi = new MockAdapter(api);
        localStorage.clear();
        jest.clearAllMocks();
    });

    afterEach(() => {
        mockApi.restore();
    });

    describe('request interceptor', () => {
        it('should attach Authorization header when token exists', async () => {
            const testToken = 'test-jwt-token';
            localStorage.setItem('accessToken', testToken);

            mockApi.onGet('/test').reply(200, { success: true });

            await api.get('/test');

            const request = mockApi.history.get[0];
            expect(request.headers?.Authorization).toBe(`Bearer ${testToken}`);
        });

        it('should not attach Authorization header when no token exists', async () => {
            mockApi.onGet('/test').reply(200, { success: true });

            await api.get('/test');

            const request = mockApi.history.get[0];
            // Authorization header should not be set (or be undefined)
            expect(request.headers?.Authorization).toBeUndefined();
        });

        it('should include Content-Type header as application/json', async () => {
            mockApi.onGet('/test').reply(200, { success: true });

            await api.get('/test');

            const request = mockApi.history.get[0];
            expect(request.headers?.['Content-Type']).toBe('application/json');
        });
    });

    describe('response interceptor', () => {
        it('should clear tokens on 401 response', async () => {
            localStorage.setItem('accessToken', 'invalid-token');
            localStorage.setItem('user', JSON.stringify({ id: '123' }));

            mockApi.onGet('/test').reply(401, { message: 'Unauthorized' });

            try {
                await api.get('/test');
            } catch (error) {
                // Expected to throw
            }

            expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
            expect(localStorage.removeItem).toHaveBeenCalledWith('user');
        });

        it('should not clear tokens on non-401 errors', async () => {
            localStorage.setItem('accessToken', 'valid-token');

            mockApi.onGet('/test').reply(500, { message: 'Server error' });

            try {
                await api.get('/test');
            } catch (error) {
                // Expected to throw
            }

            expect(localStorage.removeItem).not.toHaveBeenCalled();
        });

        it('should normalize error message from response', async () => {
            mockApi.onGet('/test').reply(400, { message: 'Validation failed' });

            try {
                await api.get('/test');
            } catch (error: any) {
                expect(error.formattedMessage).toBe('Validation failed');
            }
        });

        it('should handle array error messages', async () => {
            mockApi.onGet('/test').reply(400, { message: ['Error 1', 'Error 2'] });

            try {
                await api.get('/test');
            } catch (error: any) {
                // Should take first error from array
                expect(error.formattedMessage).toBe('Error 1');
            }
        });

        it('should default to generic message when no message provided', async () => {
            mockApi.onGet('/test').reply(500, {});

            try {
                await api.get('/test');
            } catch (error: any) {
                expect(error.formattedMessage).toBe('Request failed with status code 500');
            }
        });
    });

    describe('base configuration', () => {
        it('should use correct base URL', () => {
            expect(api.defaults.baseURL).toContain('/api/v1');
        });

        it('should have withCredentials set to true', () => {
            expect(api.defaults.withCredentials).toBe(true);
        });
    });
});
