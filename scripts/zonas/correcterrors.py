# coding=utf-8

import csv
from urllib.request import urlopen, Request 
import json
from time import sleep

# Not sure this is necessary any longer

import unicodedata
import re


def unicode_csv_reader(unicode_csv_data, dialect=csv.excel, **kwargs):
	# csv.py doesn't do Unicode; encode temporarily as UTF-8:
	csv_reader = csv.reader(utf_8_encoder(unicode_csv_data),
							dialect=dialect, **kwargs)
	for row in csv_reader:
		# decode UTF-8 back to Unicode, cell by cell:
		yield [unicode(cell, 'utf-8') for cell in row]

def utf_8_encoder(unicode_csv_data):
	for line in unicode_csv_data:
		yield line.encode('utf-8')


def getLocationFromCEP (cep):
	headers = {'Authorization': 'Token token=50f85080253eb21a7062f9f3d6b9cf15'}
	url = "http://www.cepaberto.com/api/v2/ceps.json?cep={}".format(cep)
	try:
		response = urlopen(Request(url, None, headers=headers)).read()
		location = json.loads(response.decode('utf-8'))
		if ('latitude' in location):
			return {
				'lat': location['latitude'],
				'long': location['longitude'],
				'status': 'ok'
			}
		else:
			raise Exception
	except:			
		print('Error loading location for CEP {}'.format(cep))
		return {
			'lat': 0,
			'long': 0,
			'status': 'error'
		}	


def getAddresses (fileName, addresses = {}):

	import unicodedata

	def remove_diacritic(input):
		'''
		Accept a unicode string, and return a normal string (bytes in Python 3)
		without any diacritical marks.
		'''
		# This is a big hack and I am not proud of it
		output = input.replace('√', 'A').replace('¬', 'A').replace('¡','A').replace('”', 'O').replace('‘', 'O').replace('’', 'O').replace('«', 'C').replace('Õ', 'I').replace('…', 'E').replace(' ','E').replace('⁄', 'U')
		return output
	
	print ('Loading addresses from file ' + fileName)

	with open(fileName, 'rt', encoding='mac_roman') as csvfile:
		fileReader = csv.reader(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		i = 0
		for row in fileReader:
			if (i > 0):
				uf = row[6]
				zona = row[0]
				key = uf + zona
				#address = row[2] + ', ' + row[5] + ', ' + uf + ', ## ' + row[3]
				#address = remove_diacritic(address)
				cep = row[3]
				addresses[key] = cep
			i+=1
		return addresses	

def loadErrors (addresses):
	fileName = './zonas.csv'
	with open(fileName, 'rt', encoding='utf-8') as csvfile:
		fileReader = csv.reader(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		i = 0
		errors = []
		for row in fileReader:
			if (i > 0):
				uf = row[0]
				zona = row[1]
				key = '{}{}'.format(uf, zona)
				#print (key)
				status = row[4]
				if (status != 'ok'):
					print ('Error found in ' + key)
					errors.append({
						'uf': uf,
						'zona': zona,
						'address': addresses[key]
					})
			i+=1			
		return errors			 

def correctZones (ceps):
	sourceFileName = './zonas.csv'
	targetFileName = './correctedzones.csv'
	with open(sourceFileName, 'rt', encoding='utf-8') as sourceFile:
		with open(targetFileName, 'wt', encoding='utf-8') as targetFile:
			fileReader = csv.reader(sourceFile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
			fileWriter = csv.writer(targetFile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
			i = 0
			for row in fileReader:
				if (any(row)):
					if (i > 0):
						status = row[4]
						if (status != 'ok'):
							uf = row[0]
							zona = row[1]
							key = '{}{}'.format(uf, zona)
							cep = addresses[key]
							print('Getting location for {}, CEP {}'.format(key, cep))
							location = getLocationFromCEP(cep)
							row[2] = location['lat']
							row[3] = location['long']
							row[4] = 'ok'
							sleep(3)		# This API only allows one call every three seconds
					fileWriter.writerow(row)
					i += 1	


def saveAsCSV (fileName, items, headers):
	with open(fileName, 'w', encoding='utf-8') as csvfile:
		fileWriter = csv.writer(csvfile, delimiter=';', quotechar='¨', quoting=csv.QUOTE_MINIMAL)
		fileWriter.writerow(headers)
		for item in items:
			fileWriter.writerow([item['uf'], item['zona'], item['address']])


baseNomeArquivo = 'relação_de_zonas_eleitorais_'
estados = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']
if (len(estados) != 27):
	print ("Tamanho do array estados é diferente de 27 (%i)" % len(estados))


addresses = {}
for estado in estados:
	getAddresses('./csv/%s%s.csv' % (baseNomeArquivo, estado), addresses)

print (addresses)

correctZones(addresses)





