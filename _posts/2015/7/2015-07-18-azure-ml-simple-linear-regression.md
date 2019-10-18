---
title:  Azure ML - Simple Linear Regression
date:  2015-07-18 16:00:42 +00:00
permalink:  "/2015/07/18/azure-ml-simple-linear-regression/"
categories:
- Solution
tags:
- Machine Learning
---
Now that we got the <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">basics of Machine Learning out of the way</a>, let’s look at Azure Machine Learning (<a href="http://azure.microsoft.com/en-us/services/machine-learning/" target="_blank">Azure ML</a>)!

In this blog, I will assume you know how to setup your workbench.

In general, there are quite a few great resources for Azure ML:
<ul>
	<li><a href="http://go.microsoft.com/fwlink/?LinkID=403343" target="_blank">Machine Learning Documentation Center</a></li>
	<li><a href="http://go.microsoft.com/fwlink/?LinkID=521512" target="_blank">Machine Learning Blog</a></li>
	<li><a href="http://go.microsoft.com/fwlink/?LinkID=525658" target="_blank">Community Gallery</a></li>
	<li><a href="http://go.microsoft.com/fwlink/?LinkID=521511" target="_blank">User forum</a></li>
</ul>
On the agenda:  I will take the sample set used in my previous post, perform a linear regression on it and validate that all I said about linear regression and Machine Learning is true.

This blog was done using Azure ML in mid-July 2015.  Azure ML is a product in evolution and the interface will certainly change in the future.
<h3>Create Data Source</h3>
First let’s get the data.

I will work with the same data set than in the previous articles that can <a href="http://wiki.stat.ucla.edu/socr/index.php/SOCR_Data_Dinov_020108_HeightsWeights" target="_blank">be found here</a>.  It is about the relationship between heights and weights in humans.  We will try to predict the weight given the height of different individuals.

For the point of this blog, having 200 data points is plenty and will ease the manipulation.  Let’s cut and paste their table into an Excel spreadsheet and save it into a CSV format.

Yes, believe it or not, Azure ML cannot load native Excel files!  So you need to format it in CSV.

We will create an Azure ML Data set from it.  In <a href="https://studio.azureml.net/Home/" target="_blank">Azure ML workbench</a>, select the big plus button at the bottom left of the screen, then select Data Set, then select <em>From Local File</em>

<a href="assets/2015/7/azure-ml-simple-linear-regression/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb.png" alt="image" width="356" height="224" border="0" /></a>

Select the file you just saved in Excel, and OK that.
<h3>The experiment</h3>
Click the big plus button again (at the bottom left of the screen), then select Experiment:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb1.png" alt="image" width="192" height="215" border="0" /></a>

and select Blank Experiment:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;margin:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb2.png" alt="image" width="199" height="244" border="0" /></a>

The Workbench will present you with a sort of experiment template.  Don’t get too emotionally attached:  it will disappear once you drop the first shape in (which will be in 30 seconds).

Right off the bat, you can change the name of the experiment in order to make it easier to find.  Let’s call it <em>Height-Weight</em>.  Simply type that in the canvas:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb3.png" alt="image" width="561" height="293" border="0" /></a>

You should see your data set under “My Data Set” on the left pane:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb4.png" alt="image" width="342" height="241" border="0" /></a>

Your data set will have the same name you gave it, or by default the CSV file name you uploaded.

Let’s drag the data set onto the canvas.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image5.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb5.png" alt="image" width="512" height="194" border="0" /></a>

In the “search experiment items”, let’s type ‘project’

<a href="assets/2015/7/azure-ml-simple-linear-regression/image6.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb6.png" alt="image" width="245" height="95" border="0" /></a>

Then we can select <em>Project Columns</em> and drop it on the canvas

<a href="assets/2015/7/azure-ml-simple-linear-regression/image7.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb7.png" alt="image" width="239" height="312" border="0" /></a>

We then have to link the two shapes.  In a rather counter-intuitive way, you have to start from the <em>Project Columns</em> shape towards the data set shape.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image8.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb8.png" alt="image" width="497" height="283" border="0" /></a>

Why do I want to project column?  Because I do not want to include the index column in.  Actually I did that while preparing this blog entry and the index column was used by the regression and gave bizarre results.

Let’s select the <em>Project Columns</em> shape (or module).  In the properties pane, on the right, you should be able to see a <em>Launch column selector</em>.  Well, let’s select the selector.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image9.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb9.png" alt="image" width="241" height="207" border="0" /></a>

We then simply select the two columns that has meaning:  height and weight.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image10.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb10.png" alt="image" width="579" height="193" border="0" /></a>
<h3>Model</h3>
We are now going to train a model so let’s drop a <em>Train Model</em> module in there.  If you followed so far, yes, type “train model” in the module search box, select train model and drop it under Project Columns.

Our model will be a linear regression so let’s find that module too.  There are a few type of linear regression modules, today we’ll use the one named “Linear Regression”, found under “Regression”.

Let’s link the module this way:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image11.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb11.png" alt="image" width="516" height="332" border="0" /></a>

We need to tell the model what variable (column) we want to predict.  Let’s select the train model module which should allow us to launch the column selector (from the properties pane).

You should only have the choice between weight and height.  Choose weight.

You should notice that you do not see the index column.  That’s because we projected it out basically.

Now you can run the whole thing:  simply click the Run button at the bottom of the screen.

It takes a little while.  You’ll see a clock icon on your different module until it becomes a green check as they all get run.
<h3>Result</h3>
Wow, we have our first linear regression.  What should we do with it?

Let’s plot its prediction against the data in Excel.  First, let’s find the computed parameters of the model.

Let’s right click on the bottom dot of the train model module and select <em>View Results</em>.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image12.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb12.png" alt="image" width="359" height="270" border="0" /></a>

At the bottom of the screen you should have those values:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image13.png"><img style="background-image:none;padding-top:0;padding-left:0;margin:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb13.png" alt="image" width="244" height="156" border="0" /></a>

Remember the formula <em>f(x) = m*x + b</em>?  Well, the bias is <em>b</em> while the other one (oddly name I should add) is the slope <em>m</em>.

In Excel, we can punch the following formula:  <em>=-105.377+3.42311*B2</em> and copy it for every row.  Here I assume the A column is the index, B is the “Height(Inches)”, C is the “Weight(Pounds)” and D is the column where you’ll enter that formula.  You can add a title to the column “Computed”.

You spreadsheet should look like:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image14.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb14.png" alt="image" width="384" height="262" border="0" /></a>

You can see that the computed value isn’t quite the value of the weight but is in the same range.  If you plot all of that you should get something like:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image15.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb15.png" alt="image" width="485" height="293" border="0" /></a>

The blue dots is the data while the orange ones are the prediction.

You can see that the line is passing through the cloud of data, predicting the data as well as a line can do.
<h3>Exporting predictions</h3>
Maybe you found the way I extracted the model parameter to then enter an equation in Excel a bit funny.  We could actually ask AzureML to compute the prediction for the data.

For that, let’s drop a <em>Score Model</em> module on the canvas and link it this way:

<a href="assets/2015/7/azure-ml-simple-linear-regression/image16.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb16.png" alt="image" width="526" height="388" border="0" /></a>

Basically we are using the model on the same data that was used to train it (output from the <em>Project Columns </em>module).

Let’s run the experiment one more time (run button at the bottom of the screen).  We can then right click on the bottom dot of the <em>Score Model </em>module and select <em>View Results</em>.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image17.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb17.png" alt="image" width="348" height="253" border="0" /></a>

You can then compare the values in the <em>Scored Labels</em> column to the one in the computed columns in Excel and see they are the same.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image18.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb18.png" alt="image" width="360" height="407" border="0" /></a>

We could have exported the results using a writer module, but it does require quite a few configuration to do.
<h3>Summary</h3>
I assume very little knowledge of the tool so this blog post was a bit verbose and heavy in images.

My main goal was to show you concrete representation of the concepts <a href="http://vincentlauzon.com/2015/07/02/machine-learning-an-introduction-part-1/">we discussed before</a>:
<ul>
	<li>Independent / Dependent variable in a data set</li>
	<li>Predictive model</li>
	<li>Linear Regression</li>
	<li>Optimal parameters through training</li>
</ul>
The cost function was implicit here as an option in the Linear Regression module.  You can see that by clicking on the module.

<a href="assets/2015/7/azure-ml-simple-linear-regression/image19.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/7/azure-ml-simple-linear-regression/image_thumb19.png" alt="image" width="235" height="91" border="0" /></a>

Another good introduction to AzureML is the <a href="http://www.microsoftvirtualacademy.com/training-courses/getting-started-with-microsoft-azure-machine-learning" target="_blank">Microsoft Virtual Academy training course on Machine Learning</a>.

&nbsp;

<strong>UPDATE</strong>:  See a slightly more advance example in <a href="http://vincentlauzon.com/2015/08/05/azureml-polynomial-sql-transformation/">AzureML – Polynomial Regression with SQL Transformation</a>.