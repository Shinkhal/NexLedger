import { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface IRouter {
    query: IRouterMatcher<this>;
  }
}
