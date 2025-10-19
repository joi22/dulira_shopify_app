// Next page component mein
import { useSearchParams } from "@remix-run/react";

export default function NextPage() {
    const [searchParams] = useSearchParams();

    const dealType = searchParams.get('dealType'); // 'fixed' ya 'flame'
    const campaignType = searchParams.get('type');
    const campaignName = searchParams.get('name');

    // Deal type ke according logic implement karein
    if (dealType === 'fixed') {
        // Fixed deal logic
    } else if (dealType === 'flame') {
        // Flame match logic
    }

    return (
        <div>
            {/* Your component code */}
        </div>
    );
}