//require modules
var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table2");

//establish connection to mySQL DB
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Determined08!",
  database: "bamazon"
});

//connect to DB and run getIDs function
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id: " + connection.threadId);
  getIDs();
});

// get product IDs for all available products and store in array for prompt choices
function getIDs(){
  var idsArray = [];
  var query = "SELECT item_id FROM products WHERE item_id IS NOT NULL";
  connection.query(query, function(err, res) {
    for (var i = 0; i < res.length; i++) {
      idsArray.push(res[i].item_id.toString());
    }

  //call function to display stock  
  displayStock(idsArray);
  });
}

// function to display table of all stock items
function displayStock(idsArray){
  var table = new Table({
  	head: ['ITEM ID', 'PRODUCT NAME', 'PRICE', '# IN STOCK'],
  	colWidths: [10, 35, 10, 20]
  });

  var query = "SELECT item_id, product_name, price, stock_quantity FROM products WHERE item_id IS NOT NULL";
  connection.query(query, function(err, res) {

    for (var j = 0; j < res.length; j++) {
      table.push([res[j].item_id , res[j].product_name , res[j].price , res[j].stock_quantity]);
    }
  console.log(table.toString());
  chooseProduct(idsArray);
  });
}

// function prompting user to choose item
function chooseProduct(idsArray){
    inquirer.prompt([
            {
              name: "choosenProduct",
              type: "rawlist",
              message: "Which product would you like to purchase?",
              choices: idsArray
            },
            {
              name: "quantity",
              type: "input",
              message: "How many would you like to buy?",
              validate: function(value) {
                if (isNaN(value) === false) {
                  return true;
                }
                return false;
              }
            }
    ]).then(function(customerChoice) {

      checkStock(customerChoice);
    });
}

// function to check if stock is sufficient for user request
function checkStock(customerChoice){
  var query = "SELECT stock_quantity, price FROM products WHERE item_id = ?";
  connection.query(query, customerChoice.choosenProduct, function(err, res){

    if(res[0].stock_quantity < customerChoice.quantity){
      console.log("\n I'm sorry - There is insufficient quantity in stock to complete your order. Please choose again.");
      getIDs();
    }
    else{
      confirmOrder(customerChoice,res);
    };

  });
}

// confirms order if sufficient stock available
function confirmOrder(customerChoice, queryRes){
  var newQuant = queryRes[0].stock_quantity - customerChoice.quantity;
  var query = "UPDATE products SET ? WHERE ?";
  connection.query(query,
  		[
  			{
				stock_quantity: newQuant,
			},
			{
				item_id: customerChoice.choosenProduct,
			}
		],
   function(err,res){
    console.log("\n Thank you for your purchase!  The total cost of your item(s) is " + (queryRes[0].price * customerChoice.quantity) + "\n");
  });
  getIDs();
}


