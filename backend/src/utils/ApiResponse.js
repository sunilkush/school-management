class ApiResponse {
  constructor(statusCode, data = null, message = null, meta = undefined) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message || this.getDefaultMessage(statusCode);
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  getDefaultMessage(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return "Success";
    if (statusCode === 400) return "Bad Request";
    if (statusCode === 401) return "Unauthorized";
    if (statusCode === 403) return "Forbidden";
    if (statusCode === 404) return "Not Found";
    if (statusCode >= 500) return "Internal Server Error";
    return "Something went wrong";
  }
}

export { ApiResponse };
