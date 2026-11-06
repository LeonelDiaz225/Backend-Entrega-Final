const dns = require("dns");

module.exports = function configureMongoDns() {
    try {
        const dnsServers = process.env.MONGO_DNS_SERVERS
            ? process.env.MONGO_DNS_SERVERS.split(",").map((server) => server.trim())
            : ["8.8.8.8", "1.1.1.1"];
        
        dns.setServers(dnsServers);
    } catch (error) {
        console.warn("No se pudieron configurar los servidores DNS personalizados:", error.message);
    }
};