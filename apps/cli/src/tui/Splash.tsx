import React from "react";
import { Box, Text } from "ink";
import type { ProviderSelection } from "../types.js";
import type { LicenseStatus } from "../license/verifyLicense.js";
import type { HardwareProfile } from "../config/hardware.js";

const green = "#00FF9D";
const pink = "#FF00E5";
const cyan = "#00E5FF";

export function Splash(props: {
  provider: ProviderSelection;
  license: LicenseStatus;
  hardware: HardwareProfile;
}): React.ReactElement {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color={pink}>
        {"███╗   ██╗███████╗ ██████╗ ███╗   ██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗"}
      </Text>
      <Text color={pink}>
        {"████╗  ██║██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝"}
      </Text>
      <Text color={cyan}>
        {"██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  "}
      </Text>
      <Text color={cyan}>
        {"██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  "}
      </Text>
      <Text color={green}>
        {"██║ ╚████║███████╗╚██████╔╝██║ ╚████║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗"}
      </Text>
      <Text color={green}>
        {"╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝"}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={green}>Agent online</Text>
        <Text color={cyan}>
          Provider: {props.provider.name} / {props.provider.modelId}
        </Text>
        <Text color={pink}>Tier: {props.license.tier.toUpperCase()}</Text>
        <Text color={cyan}>
          Memory: {props.hardware.totalMemoryGb}GB / {props.hardware.note}
        </Text>
      </Box>
    </Box>
  );
}
