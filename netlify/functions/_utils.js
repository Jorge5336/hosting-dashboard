
export function requireAdminSecret(event) {
  const expected = process.env.ADMIN_SECRET;
  const got = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
  if (!expected || !got || got !== expected) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: missing or invalid admin secret." }),
      headers: { "content-type": "application/json" }
    };
  }
  return null;
}

export function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

export async function readJson(event) {
  try {
    const text = event.body || "";
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON body");
  }
}
