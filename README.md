# Cloud Tears
Cloud Tears es una pequeña y simple utilidad de JavaScript que crea un componente de React para crear un overlay de lluvia encima de los elementos sobre los que se renderice.

Los parámetros de esta lluvia se pueden controlar. En el propio código viene documentado cómo.

#### Características
- **Gotas de agua personalizables:** puedes personalizar numerosos parámetros relacionados con las gotas para que queden lo más a tu gusto posible. Entre ellos se encuentran:
-- La velocidad. Desde unas lentas gotitas cayendo hasta el más tormentoso de los chaparrones.
-- La cantidad. Unas pocas gotas o el mismísimo diluvio bíblico.
-- La longitud. Gotas sutiles, chiquititas, o más largas para que se aprecie más la precipitación.

- **Interacción con el raton:** el ratón actúa como paraguas. Las gotas se deslizan alrededor de él en un radio que puedes establecer. Además, puedes configurar una sombra, de un tamaño mayor o menor, que evita que las gotas vuelvan a filtrarse bajo el paraguas una vez hayan rebotado.
- **Viento:** las gotas pueden cambiar su dirección general debido a un viento configurable.

#### Bugs conocidos
- Al redimensionar el marco, el componente no se actualiza. Esto es debido a que no incorporta un listener onResize, y es de fácil arreglo en su implementación.
- Con altos valores en el viento las gotas pierden estabilidad y pueden dar lugar a comportamientos extraños.

#### Dependencias
La utilidad necesita del módulo `react-p5`. Puede instalarse usando el comando `npm i react-p5` en la consola.