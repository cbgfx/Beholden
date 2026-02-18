import React from "react";
import { Panel } from "@/ui/Panel";
import { theme } from "@/theme/theme";
import { InfoPageLayout } from "./InfoPageLayout";

function Q(props: { q: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 900, marginBottom: 4 }}>{props.q}</div>
      <div style={{ color: theme.colors.text, lineHeight: 1.55 }}>{props.children}</div>
    </div>
  );
}

export function FaqView() {
  return (
    <InfoPageLayout title="FAQ">
      <Panel title="Common questions">
        <Q q="Where is my data stored?">
          Beholden stores campaigns locally on your machine. You can back up by copying your campaign files.
        </Q>

        <Q q="Is this a VTT or a rules engine?">
          Neither... Beholden is a campaign tracker + combat helper. It does not try to enforce rules or replace your table.
        </Q>

        <Q q="Can I import monsters?">
          Yep! the compendium supports importing monster data. If you’re missing a creature or a stat looks off,
          you can update the compendium and refresh.
        </Q>

        <Q q="Does Beholden sync to the cloud?">
          Not by default. It’s designed to work offline first. If you want sync, use a folder sync tool (Dropbox, Google Drive, etc.)
          on the data directory.
        </Q>

        <Q q="Why make this?">
          Because I used to use a great app called Game Master 5e, but it stopped working and the developer disappeared. I wanted a free tool that did the same but with a better Combat Difficulty meter.
        </Q>
        <Q q="Can my players...?">
          No. This is DM Facing. This is for a table where the DM has a laptop or tablet open to manage combat and NPCs, while players use their own character sheets and dice. I think when players have access to the same tool, it can pull focus away from the game and onto the app. I want Beholden to stay out of the way and let you focus on the game.
        </Q>
      </Panel>
    </InfoPageLayout>
  );
}
