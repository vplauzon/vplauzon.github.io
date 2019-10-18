---
title:  Managing Databases and Collections with DocumentDB Studio
date:  10/18/2014 03:00:20
permalink:  "/2014/10/17/managing-databases-and-collections-with-documentdb-studio/"
categories:
- Solution
tags:
- NoSQL
---
<p><span style="font-family:Times New Roman;font-size:12pt;">I released the first Beta version of <a href="https://studiodocumentdb.codeplex.com/">DocumentDB Studio</a>. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;"><em>DocumentDB Studio</em> is to <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a> what SQL Management Studio is to SQL Server and SQL Azure: a one-stop shop to manage and interact with your DocumentDB. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">I posted an <a href="http://vincentlauzon.com/2014/10/16/installing-documentdb-studio/">installation guide</a> of the application (very simple). 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">In this post I want to walk you through: 
</span></p><ul><li>How to connect to a DocumentDB account 
</li><li>How to create / delete databases in an account 
</li><li>How to create / delete collections within an account 
</li></ul><h2>Account keys 
</h2><p><span style="font-family:Times New Roman;font-size:12pt;">You need an Azure DocumentDB account to start using <em>DocumentDB Studio</em>. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">See my article <a href="http://vincentlauzon.com/2014/10/16/creating-an-azure-documentdb-account/">Creating an Azure DocumentDB account</a> for an easy how-to. I'll assume you created such an account. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Now let's go and retrieve a ??? key. 
</span></p><ol><li>Go to the Azure Preview Portal: <a href="https://portal.azure.com/">https://portal.azure.com/</a>
		</li><li>On the left hand side, select the BROWSE button and then DocumentDB Accounts<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat1.png" alt="" />
		</li><li>You'll be presented with the list of DocumentDB accounts you own ; select the one you want to work with.<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat2.png" alt="" />
		</li><li>You will be presented with the account blade. Click the keys button.<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat3.png" alt="" />
		</li><li>In the keys blade, click the copy button next to the secondary key<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat4.png" alt="" />
		</li></ol><p><span style="font-family:Times New Roman;font-size:12pt;">DocumentDB accounts come with a primary and secondary. Personally, I always like to give applications the secondary key while keeping the primary for myself. But it's a personal choice, you can use the primary key as well. 
</span></p><h2>Connect to an Account 
</h2><p><span style="font-family:Times New Roman;font-size:12pt;">Now that we have an account and an account key, let's connect to it in <em>Azure DocumentDB Studio</em>. 
</span></p><ol><li>Click the <em>Connect</em> button<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat5.png" alt="" />
		</li><li>In the ID textbox, type the ID (or name) of your Database account, without the entire URL. 
</li><li>In the Authorization Key, paste the secondary key you copied in the previous section.<br /><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat6.png" alt="" />
		</li></ol><p><span style="font-family:Times New Roman;font-size:12pt;">You just connected <em>Azure DocumentDB Studio</em> to your database account. 
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat7.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Note that in the folder where you copied the binaries of the solution, a new file has been added: <em>Studio.xml</em>. This file now contains the ID and authorization key of your database account. This is how your connection persists between instances of the studio. 
</span></p><h2>Creating a database 
</h2><p><span style="font-family:Times New Roman;font-size:12pt;">Now, let's create a database. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">We'll expand the account tree branch and discover the databases and media. Let's select the databases. 
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat8.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Everywhere in the resource tree, resources are lazy loaded or loaded on demand. In the case of databases, until you select the tree node, databases aren't loaded. Once you select it they are asynchronously loaded. 
</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">In our case, there are no databases yet, so let's create one by clicking on the <em>New Database</em> button in the toolbar. 
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat9.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">This pops up a dialog to query the ID (or name) of the database. Let's type <em>MyDB</em> and then click OK.
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101714_0342_managingdat10.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">This creates a MyDB database with no collections.
</span></p><p>By opening the <em>MyDB </em>tree node and clicking the Collections sub node the <em>New Collection</em> button in the toolbar becomes enabled.
</p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101814_0302_managingdat1.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Let's click it to create a collection.  Very similar experience to creating a database.
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101814_0302_managingdat2.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Now if we want to delete the collection we just created, we need to select the collection in the tree view to enable the <em>Remove Collection</em> button in the toolbar.
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101814_0302_managingdat3.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">Similarly, to delete the Database we created, we select the Database in the treeview.
</span></p><p><img src="assets/2014/10/managing-databases-and-collections-with-documentdb-studio/101814_0302_managingdat4.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
		</span></p><p><span style="font-family:Times New Roman;font-size:12pt;">So that was it for the management of databases and collection!
</span></p>