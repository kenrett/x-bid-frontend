import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    __debugLogin?: boolean;
  }
}
