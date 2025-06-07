import asyncpg
from typing import Optional, List, Dict
import logging
import asyncio

class PostgresConnector:
    def __init__(self):
        self.connection_params = {
            "host": "localhost",
            "port": 5432,
            "user": "postgres",
            "password": "password123",
            "database": "postgres"
        }
        self.pool = None

    async def connect(self) -> None:
        """Establish connection pool to PostgreSQL database"""
        try:
            self.pool = await asyncpg.create_pool(**self.connection_params)
            logging.info("Successfully connected to PostgreSQL database")
        except Exception as e:
            logging.error(f"Error connecting to PostgreSQL database: {str(e)}")
            raise

    async def disconnect(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logging.info("Database connection closed")

    async def execute_query(self, query: str, params: tuple = None) -> Optional[List[Dict]]:
        """
        Execute SQL query and return results
        
        Args:
            query (str): SQL query to execute
            params (tuple, optional): Parameters for SQL query
            
        Returns:
            List[Dict]: Query results as list of dictionaries, or None for non-SELECT queries
        """
        try:
            if not self.pool:
                await self.connect()
                
            async with self.pool.acquire() as conn:
                # Check if it's an INSERT/UPDATE/DELETE without RETURNING clause
                if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')) and 'RETURNING' not in query.upper():
                    await conn.execute(query, *params if params else ())
                    return None
                    
                # For SELECT queries and INSERT/UPDATE/DELETE with RETURNING clause
                results = await conn.fetch(query, *params if params else ())
                return [dict(row) for row in results]
                
        except Exception as e:
            logging.error(f"Query execution error: {str(e)}")
            raise

    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()

async def main():
    async with PostgresConnector() as connector:
    
        # Get table schema
        schema_query = """
        SELECT column_name, data_type, character_maximum_length
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE table_name = 'sessions';
        """
        print("\nTable Schema:")
        schema_results = await connector.execute_query(schema_query)
        for column in schema_results:
            print(f"Column: {column['column_name']}")
            print(f"Type: {column['data_type']}")
            if column['character_maximum_length']:
                print(f"Max Length: {column['character_maximum_length']}")
        print("---")

        # Get messages table schema
        messages_schema_query = """
        SELECT column_name, data_type, character_maximum_length
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE table_name = 'messages';
        """
        print("\nMessages Table Schema:")
        messages_schema_results = await connector.execute_query(messages_schema_query)
        for column in messages_schema_results:
            print(f"Column: {column['column_name']}")
            print(f"Type: {column['data_type']}")
            if column['character_maximum_length']:
                print(f"Max Length: {column['character_maximum_length']}")
        print("---")


        # Get table data
        print("\nTable Data:")
        data_query = "SELECT * FROM sessions;"
        results = await connector.execute_query(data_query)
        print(results)

if __name__ == "__main__":
    asyncio.run(main())
