import { theme } from "@/theme/theme";
import { Button } from "@/ui/Button";

export function HomeEmptyView(props: { onCreate: () => void }) {
  return (
    /* This outer div handles the centering */
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', // Full viewport height
      width: '100%',
      textAlign: 'center' // Ensures text inside elements stays centered
    }}>
      
      {/* Your original content (removed marginTop since we're centering vertically) */}
      <div style={{ maxWidth: 720 }}>
        
        <div style={{ 
          fontSize: "var(--fs-hero)", 
          fontWeight: 1000, 
          color: theme.colors.text, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '20px' // Adds a little space between logo and text
        }}>
          <img src="/beholden_logo.png" style={{ width: 220, height: 220 }} alt="Logo" />
          BEHOLDEN
        </div>

        <div style={{ marginTop: 10, fontSize: "var(--fs-large)", color: theme.colors.muted, lineHeight: 1.4 }}>
          Create your first campaign to start building adventures, encounters, rosters, and notes.
        </div>

        <div style={{ marginTop: 24 }}>
          <Button onClick={props.onCreate} style={{ padding: "10px 12px", fontSize: "var(--fs-medium)" }}>
            Create Campaign
          </Button>
        </div>

      </div>
    </div>
  );
}