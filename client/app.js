var LCD = require('lcd-pcf8574');
var Gpio = require('onoff').Gpio;
var ledRouge = new Gpio(22, 'out');
var boutonJaune = new Gpio(23, 'in', 'falling'); // Pin 23 sur front montant
var boutonRouge = new Gpio(24, 'in', 'falling'); // Pin 24 sur front montant

// i2c-0 ou i2c-1 selon version Raspberry (256M ou 512Mo)
var lcd = new LCD('/dev/i2c-0', 0x27);

// Caractère spécial (Framboise Rpi)
lcd.createChar( 0,[ 0x1B,0x15,0x0E,0x1B,0x15,0x1B,0x15,0x0E] ).createChar( 1,[ 0x0C,0x12,0x12,0x0C,0x00,0x00,0x00,0x00] );

lcd.print('-- BreizhCamp -- '+String.fromCharCode(0)).setCursor(0,1).cursorUnder();

boutonJaune.watch(function(err, value) {
  console.log('Bouton jaune appuyé');
  ledRouge.write(0);
  lcd.setCursor(0,0).print('-- BreizhCamp --');
  lcd.setCursor(0,1).print(' Yes ! Vote +1  ');
});

boutonRouge.watch(function(err, value) {
  console.log('Bouton rouge appuyé');
  ledRouge.write(1);
  lcd.setCursor(0,0).print('-- BreizhCamp --');
  lcd.setCursor(0,1).print(' Ouch ! Vote -1 ');
});

setTimeout(function() {
  d=new Date;
  var s=d.toString();
  lcd.setCursor(0,0).print(s);
  lcd.setCursor(0,1).print(s.substring(16));
  console.log(s);
}, 2000 );


// setTimeout(function() {
//  lcd.clear().setCursor(0,1).print('ironman').cursorFull();
//  lcd.setCursor(0,0).print('lego '+String.fromCharCode(0)+ '22'+String.fromCharCode(1));
// }, 6000);



