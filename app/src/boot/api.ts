import { boot } from 'quasar/wrappers';
import { apiClient } from 'src/services/apiClient';

export default boot(({ app }) => {
  // Expose the API client through Quasar app context.
  app.provide('apiClient', apiClient);
  app.config.globalProperties.$apiClient = apiClient;
});
