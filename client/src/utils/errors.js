export const getErrorMessage = (err, fallback = 'Something went wrong.') => {
  return err?.response?.data?.error?.message || err?.message || fallback
}
