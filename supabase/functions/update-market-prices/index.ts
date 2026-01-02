//@ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')!;
  const EXCHANGE_API_KEY = "e6158776fe2cf47690f4ea6e";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {  
    const fxResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/IDR`);
    const fxData = await fxResponse.json();
    
    if (fxData.result !== "success") throw new Error("API Exchange Rate Gagal");

    const rates = fxData.conversion_rates;
 
    const commoditiesData = [
      { name: "Beras Premium", code: "THB", multiplier: 450 },  
      { name: "Beras Medium", code: "THB", multiplier: 380 },
      { name: "Jagung Pipilan", code: "USD", multiplier: 0.5 }, 
      { name: "Kedelai Lokal", code: "USD", multiplier: 0.9 }
    ];

    const updates = commoditiesData.map(item => { 
      const idrValue = 1 / rates[item.code];
      const currentPrice = Math.round(idrValue * item.multiplier);
       
      return {
        commodity_name: item.name,
        current_price: currentPrice,
        previous_price: currentPrice, 
        change_percentage: 0, 
        last_updated: new Date().toISOString()
      };
    });
 
    const { data: oldPrices } = await supabase.from('market_prices').select('*');

    const finalUpdates = updates.map(newP => {
      const oldP = oldPrices?.find(o => o.commodity_name === newP.commodity_name);
      if (oldP && oldP.current_price !== newP.current_price) {
        const change = ((newP.current_price - oldP.current_price) / oldP.current_price) * 100;
        return { 
          ...newP, 
          previous_price: oldP.current_price, 
          change_percentage: parseFloat(change.toFixed(2)) 
        };
      }
      return newP;
    });
 
    const { error } = await supabase
      .from('market_prices')
      .upsert(finalUpdates, { onConflict: 'commodity_name' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, timestamp: fxData.time_last_update_utc }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
})