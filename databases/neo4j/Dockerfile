# Neo4j Community Edition with APOC and GDS
FROM neo4j:latest

# Set environment variables
ENV NEO4J_AUTH=neo4j/password123
ENV NEO4J_PLUGINS='["apoc", "graph-data-science"]'
ENV NEO4J_apoc_export_file_enabled=true
ENV NEO4J_apoc_import_file_enabled=true
ENV NEO4J_apoc_import_file_use__neo4j__config=true
ENV NEO4J_dbms_security_procedures_unrestricted=apoc.*,gds.*

# Expose Neo4j ports
EXPOSE 7474 7687

# Create volumes for persistent data
VOLUME ["/data", "/logs", "/import", "/plugins"]

# Set working directory
WORKDIR /var/lib/neo4j

# Default command (inherits from base image)
CMD ["neo4j"]
