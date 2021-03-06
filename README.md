# Atlas Eleitoral

Ferramenta de visualização de dados integrada à API do CEPESPData.
Demonstração disponível em http://www.atlas-eleitoral.com

## Instalação:

Para rodar o build, após clonar o repositório, digite:

`
cd build
node server
`

O aplicativo estará disponível em http://localhost:8008.
Para mudar a porta do servidor http, use o comando –p. Por exemplo, para rodar o servidor na porta 8000, digite:

`
node server –p 8000
`



Os fontes estão na pasta `/src` e usam o Webpack. Para compilar os fontes, é necessário instalar as dependências. Para isso, digite:

`
npm install
`

A seguir, rode o Webpack com o comando: 

` 
npm run dev
`

O Webpack abrirá uma versão de desenvolvimento com *hot reloading*. Para compilar novo build, digite

`
npm run build
`

## Usando o Atlas Eleitoral

O Atlas Eleitoral é uma ferramenta de análise exploratória que permite que você veja onde estão os votos dos nossos políticos e entender melhor suas estratégias eleitorais. 

Utilizando o banco de dados eleitorais do CEPESP (o CEPESPData), o Atlas Eleitoral mapeia os resultados das eleições para presidente, governador, senador, deputado federal e deputado estadual e distrital a partir de 1998. O aplicativo permite que você analise em detalhes o padrão espacial de votação de um candidato, ou compare seus resultados com os de outros candidatos.

Para comparar os resultados de vários candidatos, basta adicioná-los no *painel de candidatos*, à esquerda. Você pode escolher os candidatos digitando parte do nome (como uma busca do Google) ou clicando no botão `BUSCA AVANÇADA`, que abre uma caixa que oferece mais opções de escolha. Escolhidos os candidatos, você poderá, no canto superior direito do mapa, escolher vários gráficos que oferecem diversas formas para você comparar os desempenho dos candidatos em cada município e zona eleitoral.

Note que não há restrições quanto a quem você pode incluir nas comparações, exceto que todos têm de ter disputado alguma eleição no mesmo estado (senão a comparação só faria sentido para candidatos a presidente da República). Você pode, por exemplo, comparar os candidatos a governador em uma eleição, ou todos os candidatos a senador por um partido desde 1998, ou o desempenho de um deputado nos pleitos de 1998 a 2014. Você pode até fazer comparações aparentemente esdrúxulas, que só fazem sentido para você -- o Atlas Eleitoral é uma ferramenta para *você* encontrar padrões onde ninguém mais procurou! 

O outro tipo de análise é individual. Adicione um candidato e clique no seu nome; você verá um botão `VER ÍNDICES INDIVIDUAIS`. Clicando nele, você verá, no canto superior direito do mapa, quatro índices que ajudam a  identificar onde o candidato tem mais eleitores: o quociente de locação (QL), o I de Moran Local (IL), a diferença de locação (DL) e o valor-Z (Z). 

O *quociente de locação* mostra a proporção entre a votação de um candidato em um distrito (medida em porcentagem do total) e a votação do mesmo candidato na eleição toda. LQs maiores que 1 indicam que o candidato teve desempenho melhor que a média naquele distrito; LQs menores que 1 indicam *performance* inferior à média.

O *I de Moran Local* é um indicador local de associação espacial. Um I de Moran Local elevado em um distrito indica que sua votação apresenta associação com a votação dos distritos vizinhos.   

A *diferença de locação*, mais útil para candidatos majoritários, serve para identificar os distritos onde um candidato apresentou melhor e pior desempenho, em comparação com sua votação média. Por exemplo, se um candidato teve 25% dos votos totais e obteve 30% dos votos em um distrito, seu DL naquele distrito será 0,05 (+5 pontos percentuais com relação à média).

O *valor Z* é a medida tradicional de padronização, que indica quantos desvios padrões a votação em um distrito está afastada da média das votações dos distritos. O valor Z é usado para calcular o I de Moran Local.

Sugiro que você analise individualmente alguns deputados mais votados de seu estado. A estratégia geográfica de cada deputado ficará evidente.

Para fechar a análise individual e retornar ao modo de comparação entre candidatos, basta clicar no botão `VOLTAR A GRÁFICOS COMPARATIVOS` ou clicar novamente no nome do candidato sob análise.

Em ambos os modos de operação, para facilitar a visualização, é possível ver os gráficos de cada zona/município em tamanho uniforme ou proporcional à quantidade de votos daquela zona/município. Basta clicar nos ícones na parte central do lado direito. 

Espero que o Atlas Eleitoral auxilie você a conhecer mais sobre nossas eleições.

Boa pesquisa!

Fábio Cereda

Dezembro de 2017

