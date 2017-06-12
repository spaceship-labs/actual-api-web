/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the production        *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMysqlServer'
  // },
  connections:{
    mongodb: {
      adapter: 'sails-mongo',
      host: process.env.MONGODB_HOST || 'YOUR_MONGODB_SERVER_HOSTNAME_OR_IP_ADDRESS',
      port: process.env.MONGODB_PORT || 27017,
      user: process.env.MONGODB_USER || 'YOUR_MONGODB_USER',
      password: process.env.MONGODB_PASS || 'YOUR_MONGODB_PASSWORD',
      database: process.env.MONGODB_NAME || 'YOUR_MONGODB_DB',
      url:null
    },    
  }

  /***************************************************************************
   * Set the port in the production environment to 80                        *
   ***************************************************************************/

  // port: 80,

  /***************************************************************************
   * Set the log level in production environment to "silent"                 *
   ***************************************************************************/

  // log: {
  //   level: "silent"
  // }

};
