declare module "react-native-masked-view" {
  import { ComponentType } from "react";
  import { ViewProps } from "react-native";

  interface MaskedViewProps extends ViewProps {
    maskElement: React.ReactElement;
  }

  const MaskedView: ComponentType<MaskedViewProps>;
  export default MaskedView;
}
