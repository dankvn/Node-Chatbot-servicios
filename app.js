require("dotenv").config();
const axios = require("axios");
const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");
const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

const menuAPI = async () => {
  const config = {
    method: "get",
    url: "https://cultivartegenetics.onrender.com/api/products",
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API}`,
    },
  };

  const { data } = await axios(config).then((i) => i.data);

  return data.map((m) => ({
    body: [
      `*${m.attributes.name}*:${m.attributes.subtitle}`,
      `*Precio:* ${m.attributes.price} UDS`,
    ].join("\n"),
  }));
};

const flujoOnline = addKeyword('online').addAnswer('perfecto te envio un link de pago', null,
  (ctx,{flowDynamic}) => {

    const generarLink = () => `https://www.google.com/`
    flowDynamic([{body:`te envio un link de pago: ${generarLink()}`}])
  }
)

const FlujoPedido = addKeyword (['pedir','orden'])
.addAnswer ('como piesnsa pagar en *efectivo* o *online*', null, null, [flujoOnline])

const flujoPrincipal = addKeyword(["hola", "ole", "buenas"])
  .addAnswer(["Bienvenido a mi tienda", "Hoy tenemos ofertas"])
  .addAnswer(
    "El menu del día es el siguiente:",
    null,
    async (ctx, { flowDynamic }) => {
      const data = await menuAPI();
      flowDynamic(data);
    }
  )
  .addAnswer("Escribe *pedir* si te interesa algo" , {
    delay:1500
  },null,[FlujoPedido])

const flujoSegundario = addKeyword("gracias").addAnswer("De nada!");

const flujoImagen = addKeyword('imagen'). addAnswer ('Te estoy enviando un imagen',{
  media:'https://i.imgur.com/0HpzsEm.png'
})

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterProvider = createProvider(BaileysProvider);
  const adapterFlow = createFlow([flujoPrincipal, flujoSegundario, FlujoPedido, flujoImagen]);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
