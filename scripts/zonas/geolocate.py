# coding=utf-8

import csv
from urllib.request import urlopen 
import json


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


def processFile (fileName):

	def getGeolocation (address, postalCode):
		api = 'https://maps.googleapis.com/maps/api/geocode/json?address=%s&postal-code=%s&key=%s'
		key = 'AIzaSyDnVWDWExw1lGk0x1kvjmdTNLQIcB2nS30'
		address = address.replace(' ', '%20')
		url = api % (address, postalCode, key)
		try:
			response = urlopen(url)
			content= response.read()
			data = json.loads(content.decode())
			if (data['status'] == 'OK'):
				location = data['results'][0]['geometry']['location']
				locationObj = {
					'status': 'ok',
					'lat': location['lat'],
					'long': location['lng']
				}
				return locationObj
			else:
				raise Exception('not found')
		except Exception:
			locationObj = {
				'status': 'error',
				'lat': 0,
				'long': 0
			}			
			return locationObj		


	import unicodedata

	def remove_diacritic(input):
		'''
		Accept a unicode string, and return a normal string (bytes in Python 3)
		without any diacritical marks.
		'''
		# This is a big hack and I am not proud of it
		output = input.replace('√', 'A').replace('¬', 'A').replace('¡','A').replace('”', 'O').replace('‘', 'O').replace('’', 'O').replace('«', 'C').replace('Õ', 'I').replace('…', 'E').replace(' ','E').replace('⁄', 'U')
		return output
	


	print ('Processing file ' + fileName)

	#import io
	#with io.open(fileName, 'rt', encoding='mac-roman') as csvfile:


	with open(fileName, 'rt', encoding='mac_roman') as csvfile:
		fileReader = csv.reader(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		i = 0
		zonas = []
		for row in fileReader:
			if (i > 0):
				print('Locating zone {}'.format(row[0]))
				address = row[2] + ', ' + row[5] + ', ' + row[6]
				address = remove_diacritic(address)
				location = getGeolocation(address, row[3])
				if (location['status'] == 'error'):
					print ('Error in address "{}"'.format(address))
				zona = {
					'UF': row[6],
					'zona': row[0],
					'lat': location['lat'],
					'long': location['long'],
					'status': location['status']
				}
				zonas.append(zona)
			i+=1
		return zonas	


def saveAsCSV (fileName, items, headers):
	with open(fileName, 'w', encoding='utf-8') as csvfile:
		fileWriter = csv.writer(csvfile, delimiter=';', quotechar='¨', quoting=csv.QUOTE_MINIMAL)
		fileWriter.writerow(headers)
		for item in items:
			fileWriter.writerow([item['UF'], item['zona'], item['lat'], item['long'], item['status']])


baseNomeArquivo = 'relação_de_zonas_eleitorais_'
estados = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']
estados = ['SC', 'SP', 'TO']
if (len(estados) != 27):
	print ("Tamanho do array estados é diferente de 27 (%i)" % len(estados))

zonas = []
for estado in estados:
	zonas += processFile('./csv/%s%s.csv' % (baseNomeArquivo, estado))
print(zonas)
saveAsCSV ('zonas.csv', zonas, ['UF', 'zona', 'lat', 'long', 'status'])





