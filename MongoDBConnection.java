//DB
package com.businessprocess;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoException;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import org.bson.Document;
import org.bson.conversions.Bson;

public class MongoDBConnection {
    private static MongoClient mongoClient;
    private static MongoDatabase database;
    private static MongoCollection<Document> dataCollection;
    
    public static void initialize() {
        String connectionString = "mongodb+srv://<db_username>:<db_password>@cluster0.uarvxrl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

        ServerApi serverApi = ServerApi.builder()
                .version(ServerApiVersion.V1)
                .build();

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(connectionString))
                .serverApi(serverApi)
                .build();

        try {
            mongoClient = MongoClients.create(settings);
            database = mongoClient.getDatabase("business_process_db");
            dataCollection = database.getCollection("data");
            
            // Check if data collection is empty and initialize if needed
            if (dataCollection.countDocuments() == 0) {
                initializeData();
            }
            
            System.out.println("Connected to MongoDB successfully!");
        } catch (MongoException e) {
            System.err.println("Error connecting to MongoDB: " + e.getMessage());
            throw e;
        }
    }
    
    private static void initializeData() {
        Document initialData = Document.parse("""
        {
            "processes": [
                {
                    "id": "p1",
                    "name": "Customer Onboarding",
                    "subProcesses": [
                        {
                            "id": "sp1",
                            "name": "Identity Verification",
                            "systems": ["s1", "s3", "s5"],
                            "vendors": ["v2"]
                        },
                        {
                            "id": "sp2",
                            "name": "Account Setup",
                            "systems": ["s1", "s5"],
                            "vendors": []
                        }
                    ]
                },
                {
                    "id": "p2",
                    "name": "Order Processing",
                    "subProcesses": [
                        {
                            "id": "sp3",
                            "name": "Order Validation",
                            "systems": ["s2", "s5"],
                            "vendors": ["v1"]
                        }
                    ]
                },
                {
                    "id": "p3",
                    "name": "Inventory Management",
                    "subProcesses": []
                },
                {
                    "id": "p4",
                    "name": "Financial Reporting",
                    "subProcesses": []
                }
            ],
            "systems": [
                { "id": "s1", "name": "CRM System" },
                { "id": "s2", "name": "ERP Platform" },
                { "id": "s3", "name": "Customer Portal" },
                { "id": "s4", "name": "Business Intelligence Tool" },
                { "id": "s5", "name": "Enterprise Core System" }
            ],
            "vendors": [
                { "id": "v1", "name": "Cloud Provider" },
                { "id": "v2", "name": "Payment Gateway" },
                { "id": "v3", "name": "Logistics Partner" }
            ]
        }
        """);
        
        dataCollection.insertOne(initialData);
        System.out.println("Initialized database with default data");
    }
    
    public static Document getData() {
        return dataCollection.find().first();
    }
    
    public static void updateData(Document newData) {
        Bson filter = Filters.exists("_id");
        ReplaceOptions options = new ReplaceOptions().upsert(true);
        dataCollection.replaceOne(filter, newData, options);
    }
    
    public static void close() {
        if (mongoClient != null) {
            mongoClient.close();
            System.out.println("MongoDB connection closed");
        }
    }
}
