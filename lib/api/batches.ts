/**
 * Get a single batch by ID
 */
export async function getBatch(batchId: string): Promise<any> {
  const response = await fetch(`/api/batches/${batchId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch batch details");
  }

  return response.json();
} 