const { generateInvoice } = require("../utils/generateInvoice");
const Shop = require("../models/Shop");

async function generateInvoicesForAllShops() {
    try {
        console.log("🔄 Fetching all shops...");
        const shops = await Shop.findAll();

        if (!shops.length) {
            console.log("⚠️ No shops found! Exiting...");
            return;
        }

        console.log(`✅ Found ${shops.length} shops. Generating invoices...`);

        for (const shop of shops) {
            const shop_id = shop.shop_id;
            const month_year = "2025-05"; // Change to the desired month

            
            try {
                console.log(`🔄 Generating Invoice for Shop: ${shop_id}, Month: ${month_year}`);
                const invoice = await generateInvoice(shop_id, month_year);
                console.log(`✅ Invoice Generated for Shop ${shop_id}:`, invoice);
            } catch (error) {
                console.error(`❌ Failed to generate invoice for Shop ${shop_id}:`, error.message);
            }
        }

        console.log("🚀 Invoice generation process completed!");
    } catch (error) {
        console.error("❌ Error fetching shops:", error.message);
    }
}

// Run the test if executed directly
if (require.main === module) {
    generateInvoicesForAllShops();
}

module.exports = { generateInvoicesForAllShops };
