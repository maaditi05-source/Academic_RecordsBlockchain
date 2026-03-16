// Multi-host production environment configuration
// When deploying across multiple machines, set the API URL
// to the backend running on this machine.
//
// For multi-host deployment, each machine's frontend should
// connect to its own local backend, which in turn connects
// to its own peer on the blockchain network.
//
// To build with this config:
//   ng build --configuration production
//
export const environment = {
    production: true,
    // apiUrl should be set to the backend URL for this machine
    // Options:
    //   1. Use relative URL '/api' if using a reverse proxy (recommended)
    //   2. Use absolute URL with this machine's IP: 'http://<THIS_MACHINES_IP>:3000/api'
    apiUrl: '/api',
    appName: 'NIT Warangal Academic Records',
    appVersion: '1.0.0'
};
