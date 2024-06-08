const jsonServer = require('json-server');
const auth = require('json-server-auth');

const server = jsonServer.create();
const router = jsonServer.router('db.json'); // Asegúrate de que 'db.json' es tu archivo de datos
const middlewares = jsonServer.defaults();

// Cargar rutas personalizadas
const customRoutes = require('./routes.json');

// Configurar middlewares predeterminados (logger, static, cors, y no-cache)
server.use(middlewares);

// Usar el middleware json-server-auth con reglas personalizadas
server.use(auth);

// Vincular las rutas personalizadas
server.db = router.db;
for (const route in customRoutes) {
  if (customRoutes.hasOwnProperty(route)) {
    server.use(route, (req, res, next) => {
      if (customRoutes[route].includes(req.method)) {
        next();
      } else {
        res.sendStatus(401);
      }
    });
  }
}

// Middleware para expandir los detalles del producto
server.use((req, res, next) => {
  if (['GET', 'PUT'].includes(req.method) && req.path.includes('/cart')) {
    let originalSend = res.send;
    res.send = function (body) {
      console.log(body);
      let data = JSON.parse(body);

      if (Array.isArray(data)) {
        data = data[0];
      }
      console.log('ORIGINAL DATA', data);

      const products = data.products.map(product => {
        let productDetails = router.db.get('products').find({ id: product.productId }).value();
        if (productDetails) {
          product.product = {
            ...productDetails,
            //name: productDetails.name,
            id: product.productId,
          }
          console.log('PRODUCT', product);
        }

        return product;
      });

      const finalData = {
        userId: data.userId,
        products: products
      }

      console.log('FINAL DATA', finalData);

      //originalSend.call(this, JSON.stringify(data));
      originalSend.call(this, JSON.stringify(finalData));
    };
  }
  next();
});

// Usar el enrutador predeterminado
server.use(router);

// Iniciar servidor
server.listen(5500, () => {
  console.log('JSON Server with auth is running on port 5500');
});