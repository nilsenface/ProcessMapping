package com.businessprocess;

import com.google.gson.Gson;
import org.bson.Document;
import spark.Spark;

public class Main {
    public static void main(String[] args) {
        // Initialize MongoDB connection
        MongoDBConnection.initialize();
        
        // Set port (use environment variable PORT if available, otherwise use 5000)
        int port = System.getenv("PORT") != null ? Integer.parseInt(System.getenv("PORT")) : 5000;
        Spark.port(port);
        
        // Enable CORS
        enableCORS();
        
        // Define API routes
        Spark.get("/api/data", (req, res) -> {
            res.type("application/json");
            Document data = MongoDBConnection.getData();
            return data != null ? data.toJson() : "{}";
        });
        
        Spark.post("/api/data", (req, res) -> {
            res.type("application/json");
            Document newData = Document.parse(req.body());
            MongoDBConnection.updateData(newData);
            return "{\"success\": true, \"message\": \"Data updated successfully\"}";
        });
        
        // Serve static files from the "public" directory
        Spark.staticFiles.location("/public");
        
        // Add shutdown hook to close MongoDB connection
        Runtime.getRuntime().addShutdownHook(new Thread(MongoDBConnection::close));
        
        System.out.println("Server started on port " + port);
    }
    
    // Enable CORS for all routes
    private static void enableCORS() {
        Spark.options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            }

            return "OK";
        });

        Spark.before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE,OPTIONS");
            response.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Content-Length,Accept,Origin");
        });
    }
}
