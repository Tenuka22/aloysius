import { Theme } from "@astryxdesign/core";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";

/**
 * Demo card built with Astryx, the component library reserved for
 * administrative interfaces. Do not use Astryx components on
 * public-facing pages.
 */
export const AdminExampleCard = () => (
  <Theme theme={neutralTheme}>
    <Card width={360}>
      <Stack direction="vertical" gap={2}>
        <Heading level={3}>Admin Panel</Heading>
        <Text color="secondary" type="body">
          This card is built with Astryx, restricted to administrative tooling
          such as staff and RBAC management screens.
        </Text>
        <Text color="secondary" type="supporting">
          Not used on public-facing pages.
        </Text>
      </Stack>
    </Card>
  </Theme>
);
