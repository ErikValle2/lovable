import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, prompt, category } = await req.json();

    if (!imageBase64 || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageBase64 and prompt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating image with Lovable AI...');
    console.log('Category:', category);
    console.log('Prompt:', prompt);

    // Prepare instructions based on category and prompt
    let instructions = '';
    if (category === 'makeup') {
      instructions = `Apply makeup to the person in this image: ${prompt}. Keep the same pose, gender, clothes, and age. Do not modify face shape, iris, or make them look older. Generate the edited image.`;
    } else if (category === 'clothes') {
      instructions = `Dress the person in this image with: ${prompt}. Keep the same pose, gender, face, and age. Generate the edited image.`;
    } else if (category === 'style-advise') {
      instructions = `Style the person in this image according to: ${prompt}. Keep the same person and adjust their overall appearance accordingly. Generate the edited image.`;
    } else {
      instructions = `Edit this image: ${prompt}. Generate the edited image.`;
    }

    // Ensure image URL format
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: instructions
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log('Image generation successful');

    return new Response(
      JSON.stringify({ 
        generatedImageUrl,
        instructions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-tryon function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
