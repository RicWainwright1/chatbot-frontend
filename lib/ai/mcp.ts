import { createMCPClient } from "@ai-sdk/mcp";

type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

function parseAuthHeader(authString: string): Record<string, string> {
  if (authString.startsWith("Bearer ")) {
    return { Authorization: authString };
  }
  const colonIndex = authString.indexOf(":");
  if (colonIndex > 0) {
    const headerName = authString.substring(0, colonIndex);
    const headerValue = authString.substring(colonIndex + 1);
    return { [headerName]: headerValue };
  }
  return {};
}

async function createClient(
  url: string | undefined,
  auth: string | undefined,
  name: string
): Promise<MCPClient | null> {
  if (!url) return null;
  try {
    return await createMCPClient({
      transport: {
        type: "http",
        url,
        headers: auth ? parseAuthHeader(auth) : undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to connect to ${name} MCP server:`, error);
    return null;
  }
}

/**
 * Creates fresh MCP clients and fetches tools.
 * Returns tools and a cleanup function to close clients after the request completes.
 */
export async function getMcpToolsWithCleanup(): Promise<{
  tools: Record<string, any>;
  cleanup: () => Promise<void>;
}> {
  const [companyClient, surveyClient] = await Promise.all([
    createClient(
      process.env.MCP_COMPANY_SERVER_URL,
      process.env.MCP_COMPANY_SERVER_AUTH,
      "company"
    ),
    createClient(
      process.env.MCP_SURVEY_SERVER_URL,
      process.env.MCP_SURVEY_SERVER_AUTH,
      "survey"
    ),
  ]);

  let tools: Record<string, any> = {};

  if (companyClient) {
    try {
      const t = await companyClient.tools();
      tools = { ...tools, ...t };
    } catch (error) {
      console.error("Failed to fetch company MCP tools:", error);
    }
  }

  if (surveyClient) {
    try {
      const t = await surveyClient.tools();
      tools = { ...tools, ...t };
    } catch (error) {
      console.error("Failed to fetch survey MCP tools:", error);
    }
  }

  const cleanup = async () => {
    const promises: Promise<void>[] = [];
    if (companyClient) promises.push(companyClient.close().catch(() => {}));
    if (surveyClient) promises.push(surveyClient.close().catch(() => {}));
    await Promise.all(promises);
  };

  return { tools, cleanup };
}

// Convenience wrapper for backwards compat
export async function getMcpTools(): Promise<Record<string, any>> {
  const { tools } = await getMcpToolsWithCleanup();
  return tools;
}
