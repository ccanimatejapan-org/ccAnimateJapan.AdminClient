// Appends a value to FormData only when it is meaningful (not undefined/null/empty string).
// Mirrors the original activity.vue helper so multipart payloads omit blank optional fields.
export const appendIfValue = (formData, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value)
  }
}
