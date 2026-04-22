
/**
 * Google Drive API v3 Service
 * Facilitates using Drive as a serverless JSON database for BakersAlley.
 */

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'bakersalley_v3_master.json';

export class GoogleDriveService {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  private async fetchDrive(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) throw new Error("Google Drive not authenticated.");
    
    const headers = new Headers(options.headers || {});
    headers.append('Authorization', `Bearer ${this.accessToken}`);
    
    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Drive API Error");
    }

    return response;
  }

  /**
   * Locates the master database file on the user's Drive.
   */
  async findMasterFile(): Promise<string | null> {
    const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
    const response = await this.fetchDrive(`/files?q=${q}&fields=files(id)`);
    const data = await response.json();
    return data.files.length > 0 ? data.files[0].id : null;
  }

  /**
   * Downloads the current state from Drive.
   */
  async downloadDb(fileId: string): Promise<any> {
    const response = await this.fetchDrive(`/files/${fileId}?alt=media`);
    return await response.json();
  }

  /**
   * Uploads/Updates the master database file.
   */
  async uploadDb(data: any, existingFileId?: string): Promise<string> {
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
    };

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      closeDelimiter;

    const url = existingFileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(url, {
      method: existingFileId ? 'PATCH' : 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) throw new Error("Failed to upload to Drive");
    
    const result = await response.json();
    return result.id;
  }
}

export const googleDriveService = new GoogleDriveService();
