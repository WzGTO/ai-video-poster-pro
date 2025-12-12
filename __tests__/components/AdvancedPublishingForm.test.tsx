import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedPublishingForm } from '@/components/video-detail/AdvancedPublishingForm';

// Mock child components
jest.mock('@/components/scheduling', () => ({
    DateTimePicker: ({ label, onChange, value }: { label: string; onChange: (d: Date) => void; value: Date | null }) => (
        <div data-testid="datetime-picker">
            <label>{label}</label>
            <input
                type="datetime-local"
                value={value?.toISOString().slice(0, 16) || ''}
                onChange={(e) => onChange(new Date(e.target.value))}
            />
        </div>
    ),
    RecommendedTimes: ({ onSelect }: { onSelect: (d: Date) => void }) => (
        <div data-testid="recommended-times">
            <button onClick={() => onSelect(new Date())}>Select Time</button>
        </div>
    ),
}));

jest.mock('@/components/forms', () => ({
    HashtagInput: ({ label, value, onChange }: { label: string; value: string[]; onChange: (tags: string[]) => void }) => (
        <div data-testid="hashtag-input">
            <label>{label}</label>
            <input
                type="text"
                value={value.join(',')}
                onChange={(e) => onChange(e.target.value.split(',').filter(Boolean))}
            />
        </div>
    ),
    TagInput: ({ label, value, onChange }: { label: string; value: string[]; onChange: (tags: string[]) => void }) => (
        <div data-testid="tag-input">
            <label>{label}</label>
            <input
                type="text"
                value={value.join(',')}
                onChange={(e) => onChange(e.target.value.split(',').filter(Boolean))}
            />
        </div>
    ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/lib/utils', () => ({
    cn: (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' '),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdvancedPublishingForm', () => {
    const mockVideo = {
        id: 'video-1',
        title: 'Test Video',
        public_url: 'https://example.com/video.mp4',
        product_id: 'product-1',
        duration: 30,
    };

    const mockSocialStatus = {
        tiktok: true,
        facebook: true,
        youtube: false,
    };

    const mockOnPublish = jest.fn();
    const mockOnSaveDraft = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ pages: [] }),
        });
    });

    it('should render platform selection section', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        expect(screen.getByText('เลือกแพลตฟอร์ม')).toBeInTheDocument();
        expect(screen.getByText('TikTok Shop')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('YouTube')).toBeInTheDocument();
    });

    it('should show connected status for connected platforms', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        const connectedLabels = screen.getAllByText('เชื่อมต่อแล้ว');
        expect(connectedLabels.length).toBe(2); // TikTok and Facebook

        const notConnectedLabels = screen.getAllByText('ยังไม่เชื่อมต่อ');
        expect(notConnectedLabels.length).toBe(1); // YouTube
    });

    it('should render scheduling section', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        expect(screen.getByText('ตั้งเวลาโพสต์')).toBeInTheDocument();
        expect(screen.getByText('🚀 โพสต์ทันที')).toBeInTheDocument();
        expect(screen.getByText('📅 กำหนดเวลา')).toBeInTheDocument();
    });

    it('should disable publish button when no platform is selected', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        const publishButton = screen.getByRole('button', { name: /โพสต์ไปทุกแพลตฟอร์ม/i });
        expect(publishButton).toBeDisabled();
    });

    it('should show save draft button when onSaveDraft is provided', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
                onSaveDraft={mockOnSaveDraft}
            />
        );

        expect(screen.getByText(/บันทึกแบบร่าง/)).toBeInTheDocument();
    });

    it('should not show save draft button when onSaveDraft is not provided', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        expect(screen.queryByText(/บันทึกแบบร่าง/)).not.toBeInTheDocument();
    });

    it('should show connect button for disconnected platforms', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        expect(screen.getByText('เชื่อมต่อ YouTube')).toBeInTheDocument();
    });

    it('should show DateTimePicker when schedule option is selected', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        // Click on schedule option
        const scheduleButton = screen.getByText('📅 กำหนดเวลา');
        fireEvent.click(scheduleButton);

        expect(screen.getByTestId('datetime-picker')).toBeInTheDocument();
        expect(screen.getByTestId('recommended-times')).toBeInTheDocument();
    });

    it('should change button text based on schedule option', () => {
        render(
            <AdvancedPublishingForm
                video={mockVideo}
                socialStatus={mockSocialStatus}
                onPublish={mockOnPublish}
            />
        );

        // Initial state: "โพสต์ทันที"
        expect(screen.getByRole('button', { name: /โพสต์ไปทุกแพลตฟอร์ม/i })).toBeInTheDocument();

        // Click schedule option
        const scheduleButton = screen.getByText('📅 กำหนดเวลา');
        fireEvent.click(scheduleButton);

        // Button text should change
        expect(screen.getByRole('button', { name: /ตั้งเวลาโพสต์/i })).toBeInTheDocument();
    });
});
