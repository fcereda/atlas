# coding=utf-8

import io
import csv
import json
import unicodedata
from urllib.request import urlopen
import codecs

def getArgs ():
	import argparse
	argParser = argparse.ArgumentParser(description="Gerador de arquivos de geolocalizacao do CEPESP Atlas Eleitoral")
	argParser.add_argument('--results', '-rcoords', '-c',  action='store', help="Nome do arquivo de coordenadas a ser gerado", required=1) 
	argParser.add_argument('--errors', '-e',  action='store', help="Nome do arquivo no qual serão salvas as zonas/municípios sem informacao de geolocalizaćão")
	argParser.add_argument('--verbose', '-v', action='count', help="Mostra mensagens detalhadas durante o processamento das informaćoes")
	argParser.add_argument('--mcoords', '-m', action='store', help="Nome do arquivo que contém as coordenadas dos municípios")
	argParser.add_argument('--zcoords', '-z', action='store', help="Nome do arquivo que contém as coordendas das zonas eleitorais")
	argParser.add_argument('--overrides', '--ocoords', '-o', action='store', help="Nome do arquivo de overrides a ser utilizado; default é não utilizar nenhum arquivo")
	return argParser.parse_args()


def getCodigoUf (nomeuf):
	estados = {}
	estados['ACRE'] = 'AC'
	estados['ALAGOAS'] = 'AL'
	estados['AMAPA'] = 'AP'
	estados['AMAZONAS'] = 'AM'
	estados['BAHIA'] = 'BA'
	estados['CEARA'] = 'CE'
	estados['DISTRITO FEDERAL'] = 'DF'
	estados['ESPIRITO SANTO'] = 'ES'
	estados['GOIAS'] = 'GO'
	estados['MARANHAO'] = 'MA'
	estados['MATO GROSSO'] = 'MT'
	estados['MATO GROSSO DO SUL'] = 'MS'
	estados['MINAS GERAIS'] = 'MG'
	estados['PARANA'] = 'PR'
	estados['PARAIBA'] = 'PB'
	estados['PARA'] = 'PA'
	estados['PERNAMBUCO'] = 'PE'
	estados['PIAUI'] = 'PI'
	estados['RIO DE JANEIRO'] = 'RJ'
	estados['RIO GRANDE DO NORTE'] = 'RN'
	estados['RIO GRANDE DO SUL'] = 'RS'
	estados['RONDONIA'] = 'RO'
	estados['RORAIMA'] = 'RR'
	estados['SANTA CATARINA'] = 'SC'
	estados['SERGIPE'] = 'SE'
	estados['SAO PAULO'] = 'SP'
	estados['TOCANTINS'] = 'TO'

	nomeuf = remove_accents(nomeuf)
	return estados[nomeuf]


def saveAsCSV (fileName, items, headers=0):
	if (not headers):
		for id, item in items.items():
			headers = item.keys()
			break

	with open(fileName, 'w', encoding='utf-8') as csvfile:
		fileWriter = csv.DictWriter(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL, fieldnames=headers)
		fileWriter.writeheader()
		for id, item in items.items():
			fileWriter.writerow(item)



def loadCitiesAndZonesFromCEPESP ():
	url = 'http://cepesp.io/api/consulta/votos?ano=2010&cargo=3&agregacao_regional=7&selected_columns[]="UF"&selected_columns[]="NUM_ZONA"&selected_columns[]="NOME_MUNICIPIO"&selected_columns[]="DESCRICAO_CARGO"&selected_columns[]="QTDE_VOTOS"'	
	print ("Downloading data from CEPESP...")
	

	csvFile = 'zonas_e_municipios.csv'
	with urlopen(url) as response, open(csvFile, 'wb') as out_file:
	    data = response.read() # a `bytes` object
	    out_file.write(data)

	return    

	response = urlopen(url)
	csvrows = csv.reader(response.read().decode('utf-8'))
	for row in csvrows:
		print(row)



def remove_accents(input_str):
    nkfd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nkfd_form if not unicodedata.combining(c)])


def loadMunicipalityCoordinates (fileName = './localidades_BR.csv'):
	coords = {}
	with io.open(fileName, 'rt', encoding='utf-8') as sourceFile:
		rows = csv.reader(sourceFile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		for row in rows:
			if (any(row)):
				if (remove_accents(row[1]) == remove_accents(row[3])):
					# Temos um município, pois NM_LOCALIDADE == NM_MUNICIPIO
					coord = {}
					coord['uf'] = getCodigoUf(row[2])
					coord['municipio'] = remove_accents(row[3]).upper().replace('&APOS;', "'")
					coord['lat'] = row[5]
					coord['long'] = row[4]
					id = '{}-{}'.format(coord['uf'], coord['municipio'])
					coords[id] = coord	
				else:
					if (row[2] == 'PARÁ***'):
						print('Descartado: {}, localidade de {}'.format(row[3], row[1]))
	return coords			


def agruparCoordsPorUF (coords):
	ufs = {}
	for id, coord in coords.items():
		uf = coord['uf']
		municipio = remove_accents(coord['municipio']).upper()
		if (not uf in ufs):
			ufs[uf] = {}
		ufs[uf][municipio] = coord
	return ufs	


def loadZonasEMunicipios (fileName = './data/zonas_municipios.csv'):
	# Nós deveríamos carregar esses dados diretamente do site do CEPESP,
	# mas por enquanto vamos usar um CSV carregado anteriormente
	with io.open(fileName, 'rt', encoding='utf-8') as sourceFile:
		rows = csv.DictReader(sourceFile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		locais = {}
		for row in rows:
			id = '{}-{:03d}'.format(row['COD_MUN_TSE'], int(row['NUM_ZONA'])) 
			#local = 
			locais[id] = {
				'id': id,
				'codTSE': row['COD_MUN_TSE'],
				'municipio': row['NOME_MUNICIPIO'],
				'zona': row['NUM_ZONA'],
				'uf': row['UF']
			}

	return locais

def loadZoneCoordinates (fileName = './data/correctedzones.csv'):
	with io.open(fileName,'rt', encoding='utf-8') as sourceFile:
		rows = csv.DictReader(sourceFile, delimiter=';')
		coordZonas = {}
		for row in rows:
			id = '{}-{:03d}'.format(row['UF'].upper(), int(row['zona']))
			coordZonas[id] = row  
		return coordZonas


def loadOverrides (fileName):
	if (not fileName):
		return []
	with io.open(fileName, 'rt', encoding='utf-8') as sourceFile:
		rows = csv.DictReader(sourceFile, delimiter=',')
		coords = {}
		for row in rows:
			id = row['id']
			coords[id] = {
				'id': id,
				'codTSE': id[0:5],
				'zona': int(id[6:9]),
				'uf': row['uf_zona'][0:2],
				'municipio': row['municipio'],
				'lat': row['lat'],
				'long': row['long']
			}
		return coords	




options = getArgs()
verboseprint = print if options.verbose else lambda *a, **k: None

print('Loading locais from CSV file...')
locais = loadZonasEMunicipios()
verboseprint('{} locais loaded'.format(len(locais)))

# Neste momento, a lista locais[] possui a relacao de municipios e zonas
# Nossa tarefa agora é encontrar a localizacao de cada local

# Para isso, temos de identificar os municípios que tenham mais de uma zona
# Para os municipios que tenham apenas uma zona, a localizaćão da zona-município 
# é dada pela localizaćão do municipio
# Para os municipios que tenham mais de uma zona, a localizaćão da zona-municipio
# é dada pela localizaćão da zona

zonasPorMunicipio = {}
for id, local in locais.items():
	idMunicipio = '{}-{}'.format(local['uf'], local['municipio'])
	if (not idMunicipio in zonasPorMunicipio):
		zonasPorMunicipio[idMunicipio] = []
	zonasPorMunicipio[idMunicipio].append(local)	

municipiosComMaisDeUmaZona = 0
for idMunicipio, zonas in zonasPorMunicipio.items():
	if (len(zonas) > 1):
		municipiosComMaisDeUmaZona += 1
verboseprint ('{} municípios possuem mais de uma zona'.format(municipiosComMaisDeUmaZona))

municipiosMultZona = {}
for idMunicipio, zonas in zonasPorMunicipio.items():
	if (len(zonas) > 1):
		municipiosMultZona[idMunicipio] = zonas
		verboseprint('{}: {} zonas'.format(idMunicipio, len(zonas)))


print('Loading city coordinates from CSV file...')
coordCidades = loadMunicipalityCoordinates()
# coordCidades é um Dict identificado com a chave 'UF-MUNICIPIO'
verboseprint('{} city coordinates loaded'.format(len(coordCidades)))

print('Loading zone coordinates from CSV file...')
coordZonas = loadZoneCoordinates()
# coordZonas é um Dict identificado com a chave 'UF-ZONA'
verboseprint('{} zone coordinates loaded'.format(len(coordZonas)))
verboseprint('*** {}'.format(coordZonas['SP-398']))

coordsByUf = agruparCoordsPorUF (coordCidades)

for key, local in locais.items():
	uf = local['uf']
	municipio = remove_accents(local['municipio']).upper()
	if (municipio in coordsByUf[uf]):
		coord = coordsByUf[uf][municipio]
		# TEM ALGO ERRADO AQUI -- PARA QUE SERVE A VARIAVEL coord?	

# Agora finalmente vamos associar uma coordenada a cada local (da lista locais[])

# Inicialmente, criamos um Dict coordLocais{} populada com as coordenadas dos municípios
# O Dict erros armazena as cidades cujas coordenadas não foram encontradas (vamos ter que tratar isso depois)

coordLocais = {}
erros = {}
for id, local in locais.items():
	idCidade = '{}-{}'.format(local['uf'], remove_accents(local['municipio']).upper())
	if (idCidade in coordCidades):
		coordCidade = coordCidades[idCidade]
		coordLocal = {
			'id': id,
			'codTSE': local['codTSE'],
			'municipio': local['municipio'],
			'zona': local['zona'],
			'uf': local['uf'],
			'lat': coordCidade['lat'],
			'long': coordCidade['long']
		}
		coordLocais[id] = coordLocal
	else:
		erros[id] = idCidade	


# Agora, alteramos coordLocais{} para usar as coordenadas das zonas nos casos de 
# municípios com mais de uma zona


verboseprint('*** Municipios com mais de uma zona:')

displayLater = []

for municipio, zonas in municipiosMultZona.items():
	verboseprint('{}: {} zonas'.format(municipio, len(zonas)))
	for zona in zonas:
		idZona = '{}-{:03d}'.format(zona['uf'], int(zona['zona']))
		verboseprint('Zona {}'.format(idZona))
		if (idZona in coordZonas):
			coordZona= coordZonas[idZona]
			zona['lat'] = coordZona['lat']
			zona['long'] = coordZona['long']
			verboseprint('Coordenadas da zona {}: lat {} long {}'.format(idZona, zona['lat'], zona['long']))
			idLocal = '{}-{:03d}'.format(zona['codTSE'], int(zona['zona']))
			if (idLocal in coordLocais):
				coordLocais[idLocal]['lat'] = coordZona['lat']
				coordLocais[idLocal]['long'] = coordZona['long']
				verboseprint('Coordenadas da zona {}: lat {} long {}'.format(idLocal, coordLocais[idLocal]['lat'], coordLocais[idLocal]['long']))
			else:
				verboseprint('Not found coordLocais[{}]'.format(idLocal))
		else:
			erros[idZona] = zona		


verboseprint('{} erros encontrados:'.format(len(erros)))
for id, local in erros.items():
	if ('municipio' in local):
		zoneId = '{}-{:03d}'.format(local['codTSE'], int(local['zona']))
		texto = '"{}","{}","{}"'.format(zoneId, id, local['municipio'])
	else:
		texto = '"{}","{}"'.format(id, local)
	verboseprint(texto)	

print('Carregando correcões manuais (overrides)...')
overrides = loadOverrides('./data/overrides.csv')
jaExistem = 0
if (len(overrides)):
	for id, coordLocal in overrides.items():
		if (id in coordLocais):
			jaExistem += 1
		coordLocais[id] = coordLocal
verboseprint('{} correćões manuais carregadas'.format(len(overrides)))
verboseprint('{} coordenadas foram corrigidas, {} novas coordenadas foram acrescentadas'.format(jaExistem, len(overrides)-jaExistem))

# prints all coordinates

for idZona, zona in coordLocais.items():
	if (zona['uf'] == 'AP'):
		print('{}: {}-{} -> {},{}'.format(idZona, zona['uf'], zona['municipio'], zona['lat'], zona[ 'long']))

print('{} zonas geolocalizadas'.format(len(coordLocais)))	

#print (coordCidades)
#print (coordLocais['06068-010'])

verboseprint('Saving results file to "{}"'.format(options.results))
saveAsCSV(options.results, coordLocais, ['id', 'uf', 'municipio', 'zona', 'lat', 'long', 'codTSE'])

exit()

#for key, local in locais.items():
#	if (local['uf'] == 'SP' and local['municipio'] == 'São Paulo'):
#		print ('{}: {} {}'.format(key, local['uf'], local['municipio']))		





totalMunicipios = 0
for key in coordsPorUF:
	numMunicipios = len(coordsPorUF[key])
	totalMunicipios += numMunicipios
	print ('{}: {} municípios'.format(key, numMunicipios))
print('{} municípios em todo o Brasil'.format(totalMunicipios))	

# print ('Lista dos estados')
# estados = []
# for uf in coordsPorUF:
# 	estados.append(uf)
# estados.sort();
# for estado in estados:
#	print ("estados['{}'] = ''".format(remove_accents(estado)))		

municipios = []
for coord in coordsPorUF['PARÁ']:
	municipios.append(coord['municipio'])
municipios.sort()
for municipio in municipios:
	print (municipio)	


