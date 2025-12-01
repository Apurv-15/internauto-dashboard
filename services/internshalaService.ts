const API_BASE_URL = 'http://localhost:3001/api';

export interface InternshipData {
    id: string;
    title: string;
    company: string;
    location: string;
    stipend: string;
    posted: string;
    link: string;
    status: string;
}

export interface VerifyCredentialsResponse {
    success: boolean;
    message: string;
    redirectUrl?: string;
}

export interface SearchInternshipsResponse {
    success: boolean;
    internships: InternshipData[];
    count: number;
    message?: string;
}

export interface ApplyInternshipResponse {
    success: boolean;
    message: string;
    status: string;
}

export interface StatusResponse {
    isLoggedIn: boolean;
    browserActive: boolean;
}

/**
 * Verify Internshala credentials and login
 */
export async function verifyCredentials(email: string, password: string): Promise<VerifyCredentialsResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Verify credentials error:', error);
        return {
            success: false,
            message: 'Failed to connect to backend server. Make sure it is running.',
        };
    }
}

/**
 * Search for internships based on filters
 */
export async function searchInternships(
    keywords: string,
    location: string,
    remoteOnly: boolean,
    minStipend: number
): Promise<SearchInternshipsResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/search-internships`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keywords,
                location,
                remoteOnly,
                minStipend,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Search internships error:', error);
        return {
            success: false,
            internships: [],
            count: 0,
            message: 'Failed to search internships',
        };
    }
}

/**
 * Apply to an internship
 */
export async function applyToInternship(
    internshipUrl: string,
    answers: Array<{ question: string; answer: string }>
): Promise<ApplyInternshipResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/apply-internship`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                internshipUrl,
                answers,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Apply internship error:', error);
        return {
            success: false,
            message: 'Failed to apply to internship',
            status: 'failed',
        };
    }
}

/**
 * Get backend status
 */
export async function getBackendStatus(): Promise<StatusResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get status error:', error);
        return {
            isLoggedIn: false,
            browserActive: false,
        };
    }
}

/**
 * Logout and close browser
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            message: 'Failed to logout',
        };
    }
}
