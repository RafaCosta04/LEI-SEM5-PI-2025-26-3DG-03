import http, { IncomingMessage } from 'http';
import https from 'https';

export interface VesselVisitNotificationDTO {
  id: number;
  code: string;
  vesselIMO?: string;
  visitStatus?: string;
  vessel?: {
    vesselName?: string;
    imoNumber?: string;
    [key: string]: any;
  };
  cargoManifests?: Array<{
    manifestType: string;
    entries?: Array<{
      containerNumber: string;
      row: number;
      bay: number;
      tier: number;
      storageAreaCode: string;
    }>;
  }>;
  [key: string]: any;
}

export default class VesselVisitNotificationClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public async getByCode(code: string, authHeader?: string): Promise<VesselVisitNotificationDTO | null> {
    const url = `${this.baseUrl}/VesselVisitNotification/ByCode/${encodeURIComponent(code)}`;
    const json = await this.getJson(url, authHeader);
    return json as VesselVisitNotificationDTO | null;
  }

  public async getAll(authHeader?: string): Promise<VesselVisitNotificationDTO[]> {
    const url = `${this.baseUrl}/VesselVisitNotification`;
    const json = await this.getJson(url, authHeader);
    return (json as VesselVisitNotificationDTO[]) || [];
  }

  private async getJson(urlStr: string, authHeader?: string): Promise<any> {
    const urlObj = new URL(urlStr);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options: https.RequestOptions = {
      method: 'GET',
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + (urlObj.search || ''),
      headers: {
        'Accept': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    };

    return new Promise((resolve, reject) => {
      const req = lib.request(options, (res: IncomingMessage) => {
        const { statusCode } = res;
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (statusCode && statusCode >= 200 && statusCode < 300) {
            try {
              resolve(data ? JSON.parse(data) : null);
            } catch (err) {
              reject(err);
            }
          } else if (statusCode === 404) {
            resolve(null);
          } else if (statusCode === 401 || statusCode === 403) {
            reject(new Error('Unauthorized when contacting VesselVisitNotification API'));
          } else {
            reject(new Error(`VesselVisitNotification API error: ${statusCode} ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }
}
