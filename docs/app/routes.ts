import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/docs/layout.tsx", [
    route("docs", "routes/docs/index.tsx"),
    route("docs/getting-started", "routes/docs/getting-started.tsx"),
    route("docs/inheritance", "routes/docs/inheritance.tsx"),
    route("docs/sub-environments", "routes/docs/sub-environments.tsx"),
    route("docs/overrides", "routes/docs/overrides.tsx"),
    route("docs/encryption", "routes/docs/encryption.tsx"),
    route("docs/cli", "routes/docs/cli.tsx"),
  ]),
] satisfies RouteConfig;
