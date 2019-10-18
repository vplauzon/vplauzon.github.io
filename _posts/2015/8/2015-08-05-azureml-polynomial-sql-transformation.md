---
title:  AzureML - Polynomial Regression with SQL Transformation
date:  2015-08-05 23:00:46 +00:00
permalink:  "/2015/08/05/azureml-polynomial-sql-transformation/"
categories:
- Solution
tags:
- Machine Learning
---
I meant to illustrate <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/#overfitting">over fitting</a> (discussed in a <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">past blog</a>) with <a href="http://azure.microsoft.com/en-us/services/machine-learning/" target="_blank">AzureML</a>.  An easy way to illustrate it is to fit a bunch of sample points near perfectly and the best tool for that is <a href="https://en.wikipedia.org/wiki/Polynomial_regression" target="_blank">Polynomial Regression</a>.

I was surprised to see that AzureML doesn’t support Polynomial Regression natively.  But…  while thinking about it, you can implement it using a linear regression.  In order to do that, I’ll introduce a useful module of AzureML:  <em>Apply SQL Transformation</em>.

So I will keep over fitting for a future blog and concentrate on polynomial regression for today!
<h3>Data Set</h3>
But first, let’s construct a data set.  I want something that looks like a linear pattern with a bit of a wave driving it to simulate a bit of noise on top of a linear pattern.

Let’s build it in Excel.  Very small data set:  20 points.  Two columns:  X &amp; Y.  Column X goes from 1 to 20.  Column Y is a formula:  <em>=SIN(3.5*(A2-1)/20*2*PI())+A2/2</em>.  So basically, I add a sinusoid to a linear formula.  This gives the following data set:
<table border="1" cellspacing="0" cellpadding="0">
<tbody>
<tr style="background:orange;">
<td valign="bottom" width="64"><strong>X</strong></td>
<td valign="bottom" width="64"><strong>Y</strong></td>
</tr>
<tr>
<td valign="bottom" width="64">1</td>
<td valign="bottom" width="64">0.5</td>
</tr>
<tr>
<td valign="bottom" width="64">2</td>
<td valign="bottom" width="64">2.526591</td>
</tr>
<tr>
<td valign="bottom" width="64">3</td>
<td valign="bottom" width="64">2.540285</td>
</tr>
<tr>
<td valign="bottom" width="64">4</td>
<td valign="bottom" width="64">2.092728</td>
</tr>
<tr>
<td valign="bottom" width="64">5</td>
<td valign="bottom" width="64">2.118427</td>
</tr>
<tr>
<td valign="bottom" width="64">6</td>
<td valign="bottom" width="64">2.365618</td>
</tr>
<tr>
<td valign="bottom" width="64">7</td>
<td valign="bottom" width="64">4.31284</td>
</tr>
<tr>
<td valign="bottom" width="64">8</td>
<td valign="bottom" width="64">5.546013</td>
</tr>
<tr>
<td valign="bottom" width="64">9</td>
<td valign="bottom" width="64">5.359401</td>
</tr>
<tr>
<td valign="bottom" width="64">10</td>
<td valign="bottom" width="64">5.086795</td>
</tr>
<tr>
<td valign="bottom" width="64">11</td>
<td valign="bottom" width="64">4.71177</td>
</tr>
<tr>
<td valign="bottom" width="64">12</td>
<td valign="bottom" width="64">5.876326</td>
</tr>
<tr>
<td valign="bottom" width="64">13</td>
<td valign="bottom" width="64">7.551295</td>
</tr>
<tr>
<td valign="bottom" width="64">14</td>
<td valign="bottom" width="64">8.585301</td>
</tr>
<tr>
<td valign="bottom" width="64">15</td>
<td valign="bottom" width="64">7.922171</td>
</tr>
<tr>
<td valign="bottom" width="64">16</td>
<td valign="bottom" width="64">7.470766</td>
</tr>
<tr>
<td valign="bottom" width="64">17</td>
<td valign="bottom" width="64">8.179313</td>
</tr>
<tr>
<td valign="bottom" width="64">18</td>
<td valign="bottom" width="64">9.332662</td>
</tr>
<tr>
<td valign="bottom" width="64">19</td>
<td valign="bottom" width="64">10.66634</td>
</tr>
<tr>
<td valign="bottom" width="64">20</td>
<td valign="bottom" width="64">11.06512</td>
</tr>
</tbody>
</table>
If you plot that in Excel:

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image21.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb21.png" alt="image" width="672" height="408" border="0" /></a>

As I’ve shown in a <a href="http://vincentlauzon.com/2015/07/18/azure-ml-simple-linear-regression/">previous blog</a>, we can take that data and import it in AzureML as a Data Set.  I’ll skip the details for that here.
<h3>From polynomial to linear</h3>
So AzureML doesn’t support polynomial regression.  What can we do?

If you think about it 2 minutes, a polynomial regression is polynomial only in terms of the observed data, not the parameters.  A polynomial regression, in one dimension, is

f(x) = a_0 + a_1*x + a_2*x^2 + a_3*x^3 + … + a_n*x^n

which looks like a linear regression with n dimensions in input and one in output.  The input vector would be (x, x^2, …, x^n).  The regression becomes:

f(x) = a_0 + (a_1, a_2, …, a_n) * (x, x^2, …, x^n)

where the multiplication here is a scalar multiplication between two vectors.  Therefore we are back to a linear regression!

The trick is simply to augment the data set for it to contain the square, cube, etc.  of the observed (independent) variable.
<h3>Apply SQL Transformation</h3>
We could augment the data set directly in the data set but that’s a bit clunky as it pollutes the data set.  Ideally we would do it “dynamically”, i.e. within an experiment.  Enters <em>Apply SQL Transformation</em>.

Let’s start a new experiment and drop the data set we just created on it.  Then, let’s drop a <em>Apply SQL Transformation</em> module (you can search for <em>SQL</em>) and link the two together:

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image22.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb22.png" alt="image" width="357" height="199" border="0" /></a>

<em>Apply SQL Transformation</em> has three entry points but only one is mandatory.  The entry points are like SQL tables you would feed it.  In our case, we only have one data set.

If you select the module you’ll see it takes an SQL expression in parameter:

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image23.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb23.png" alt="image" width="275" height="221" border="0" /></a>

<em>t1</em> in the SQL expression refers to the first entry point of the module.  You could also use <em>t2</em> and <em>t3</em> if you would connect the other entry points.

It is said in the <a href="https://msdn.microsoft.com/library/azure/90381e80-67c3-4d99-8754-1db785b7ea37" target="_blank">documentation</a> that it understands <a href="http://www.sqlite.org/lang.html" target="_blank">SQLite</a>.  For our needs the limitation of SQLite vs TSQL won’t be any problem.

We will input this SQL:

<em>SELECT
X,
X*X AS X2,
Y
FROM t1</em>

Basically we do a typical SQL projection using the SQL syntax.  This is quite powerful and can easily replace <em>Project Columns</em> and <em>Metadata Editor</em> modules in one go.

You can run the experiment and then look at the results by right clicking at the bottom of the SQL module.

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image24.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb24.png" alt="image" width="498" height="257" border="0" /></a>

You can see that the column we added is there with square value.

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image25.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb25.png" alt="image" width="388" height="314" border="0" /></a>
<h3>Doing the linear regression</h3>
We can then continue and drop a linear regression, train model &amp; score model on the experiment and connect them like this:

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image26.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb26.png" alt="image" width="481" height="273" border="0" /></a>

By selecting the train model module, we can click its “Launch column selector” button and select the <em>Y</em> variable.  That is the variable the linear regression will predict.

We can now run the experiment and then look at the result of the <em>Train Model </em>module (not the score model one).

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image27.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb27.png" alt="image" width="155" height="157" border="0" /></a>

This is an interesting result.  AzureML is associating a very weak weight to x^2.  That means it isn’t really using it.  Why?

Well, if you think about it, a polynomial degree 2 is a <a href="https://en.wikipedia.org/wiki/Parabola" target="_blank">parabola</a> and a parabola isn’t much better than a line to predict our sample set.  Therefore AzureML reverts to a linear predictor despite we gave it the power to use more degrees of freedom!

It’s important you develop the reflex to read results like this.  In my toy sample, we can visualize it all and deduce it at a glance, but with typical data sets, the dimension is high and you can’t visualize it.

Here AzureML is telling is:  your data is linear!
<h3>Over fitting</h3>
Remember I talked about <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/#overfitting">over fitting</a>?  That is, the tendency of a learning algorithm to try to fit the sample data perfectly if it can.  This typically happens when the learning algorithm has a lot of parameters and the sample data set has little information, i.e. it’s either small or contain records that do not add information (e.g. once you’ve given two points on a line, giving another thousand on the same line doesn’t add information about the data).

Here my data roughly has 8 tops and bottoms if you will.  So if I would go and have a polynomial degree 9th, we should be able to match the curve more perfectly.

Let’s go back to the <em>Apply SQL Transformation</em> module and change the SQL expression for

<em>SELECT
X,
X*X AS X2,
X*X*X AS X3,
X*X*X*X AS X4,
X*X*X*X*X AS X5,
X*X*X*X*X*X AS X6,
X*X*X*X*X*X*X AS X7,
X*X*X*X*X*X*X*X AS X8,
X*X*X*X*X*X*X*X*X AS X9,
Y
FROM t1</em>

Let’s run the experiment again and look at the result of the <em>Train Model </em>module.

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image28.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb28.png" alt="image" width="209" height="394" border="0" /></a>

Now we see that AzureML used the parameters we made available.  It is normal that the weight value go down since the data goes up (i.e. x^9 &gt;&gt; x for x&gt;1).

Could we visualize the result?
<h3>Visualizing</h3>
The method of visualizing the prediction of an algorithm I found is quite clunky so if you have a better one, please let me know in the commentary.

Basically, you drop a <em>Writer</em> module that you connect to the output of the <em>Score Model</em> module.

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image29.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb29.png" alt="image" width="240" height="109" border="0" /></a>

Then you can configure the writer to write in a blob container as CSV.  You then take the CSV and paste the last column (the score column) in excel next to the input data.  As I said…   clunky.

Anyway, if you plot that you’ll get:

<a href="assets/2015/8/azureml-polynomial-sql-transformation/image30.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/azureml-polynomial-sql-transformation/image_thumb30.png" alt="image" width="672" height="408" border="0" /></a>

The blue dots are the sample set and the orange dots are the predicted points.  As you see, the learning algorithm is getting closer to the training data.

Is that a good thing?  It depends!  If your data was really linear with noise in it, you are training AzureML to predict noise which rarely is possible nor useful.  That is over fitting.  If your data really has those bumps in it, then there you go.
<h3>Summary</h3>
It is possible to implement a Polynomial Regression using <em>Linear Regression</em> and <em>Apply SQL Transformation</em> modules.

The latter module is quite powerful and can replace both <em>Project Columns</em> and <em>Metadata Editor</em> modules.  You could even do some data clean up using that module (via a where clause).