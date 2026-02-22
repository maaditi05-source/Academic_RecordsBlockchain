/**
 * Application Configuration
 * Central configuration file for all environment-specific and application-wide settings
 */

export interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Blockchain Configuration
  blockchain: {
    networkName: string;
    channelName: string;
  };

  // Application Settings
  app: {
    name: string;
    version: string;
    instituteName: string;
    instituteShortName: string;
    verificationBaseUrl: string;
  };

  // Authentication Settings
  auth: {
    tokenKey: string;
    sessionTimeout: number; // in minutes
    rememberMeDuration: number; // in days
  };

  // UI Settings
  ui: {
    itemsPerPage: number;
    maxFileSize: number; // in MB
    allowedFileTypes: string[];
    dateFormat: string;
    timeFormat: string;
  };

  // PDF Generation Settings
  pdf: {
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    fonts: {
      default: string;
      heading: string;
    };
  };

  // QR Code Settings
  qrCode: {
    size: number;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  };

  // Feature Flags
  features: {
    enableCertificateVerification: boolean;
    enablePdfDownload: boolean;
    enableSharing: boolean;
    enableNotifications: boolean;
  };
}

/**
 * Production Configuration
 */
export const productionConfig: AppConfig = {
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  blockchain: {
    networkName: 'nit-warangal-network',
    channelName: 'academic-channel',
  },

  app: {
    name: 'Academic Records Management System',
    version: '1.0.0',
    instituteName: 'National Institute of Technology, Warangal',
    instituteShortName: 'NIT Warangal',
    verificationBaseUrl: 'https://nitw.ac.in',
  },

  auth: {
    tokenKey: 'auth_token',
    sessionTimeout: 480, // 8 hours
    rememberMeDuration: 30, // 30 days
  },

  ui: {
    itemsPerPage: 10,
    maxFileSize: 10, // 10 MB
    allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'hh:mm a',
  },

  pdf: {
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    fonts: {
      default: 'helvetica',
      heading: 'helvetica',
    },
  },

  qrCode: {
    size: 80,
    margin: 1,
    errorCorrectionLevel: 'M',
  },

  features: {
    enableCertificateVerification: true,
    enablePdfDownload: true,
    enableSharing: true,
    enableNotifications: true,
  },
};

/**
 * Development Configuration
 */
export const developmentConfig: AppConfig = {
  ...productionConfig,
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 60000,
    retryAttempts: 1,
  },
  app: {
    ...productionConfig.app,
    verificationBaseUrl: 'http://localhost:4200',
  },
};

/**
 * Get the appropriate configuration based on environment
 */
function getConfig(): AppConfig {
  // Guard against SSR (window is undefined on Node.js)
  if (typeof window === 'undefined') {
    return developmentConfig;
  }
  const isDevelopment = !window.location.hostname.includes('nitw.ac.in');
  return isDevelopment ? developmentConfig : productionConfig;
}

/**
 * Export the active configuration
 */
export const APP_CONFIG: AppConfig = getConfig();

/**
 * Helper function to get API URL
 */
export function getApiUrl(endpoint: string = ''): string {
  return `${APP_CONFIG.api.baseUrl}${endpoint}`;
}

/**
 * Helper function to get verification URL
 */
export function getVerificationUrl(type: 'certificate' | 'record', id: string): string {
  return `${APP_CONFIG.app.verificationBaseUrl}/verify/${type}/${id}`;
}

/**
 * Helper function to check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return APP_CONFIG.features[feature];
}
