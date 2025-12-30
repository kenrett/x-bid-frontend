import type { operations } from "@api/openapi-types";

declare module "@api/openapi-types" {
  export interface paths {
    "/api/v1/signup": {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      get?: never;
      put?: never;
      post: operations["POST__api_v1_users"];
      delete?: never;
      options?: never;
      head?: never;
      patch?: never;
      trace?: never;
    };
  }
}
