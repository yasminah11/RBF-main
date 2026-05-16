import { useState, useEffect } from "react";

export function useAdminAuth() {
  // Always authorized for prototype testing
  return { isAdmin: true, loading: false };
}
