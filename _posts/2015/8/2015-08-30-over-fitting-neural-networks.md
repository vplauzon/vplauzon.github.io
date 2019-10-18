---
title:  Azure ML – Over fitting with Neural Networks
date:  08/30/2015 23:00:59
permalink:  "/2015/08/30/over-fitting-neural-networks/"
categories:
- Solution
tags:
- Machine Learning
---
In a <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">past post</a>, I discussed the concept of <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2#overFitting">over fitting</a> in Machine Learning.  I also alluded to it in <a href="http://vincentlauzon.com/2015/07/25/azureml-polynomial-regression-with-sql-transformation/">my post about Polynomial Regression</a>.

Basically, over fitting occurs when your model performs well on training data and poorly on data it hasn’t seen.

In here I’ll give an example using Artificial Neural Networks.  Those can be quite prone to over fitting since they have variable number of parameters, i.e. different number of hidden nodes.  Over fitting will always occur once you put too many parameters in a model.
<h3>Data</h3>
I’ll reuse the height-weight data set I had <a href="http://vincentlauzon.com/2015/07/18/azure-ml-simple-linear-regression/">you created in a past post</a>.  If you need to recreate it, go back to that post.

Then let’s create a new experiment, let’s title it “<em>Height-Weight - Overfitting</em>” and let’s drop the data set on it.

We do not want the Index column and I would like to rename the columns.  Let’s use our new friend the <em><a href="http://vincentlauzon.com/2015/07/25/azureml-polynomial-regression-with-sql-transformation/">Apply SQL Transformation</a></em> module with the following SQL expression:

<em>SELECT
"Height(Inches)" AS Height,
"Weight(Pounds)" AS Weight
FROM t1</em>

In one hit, I renamed fields and remove another one.

We will then drop a <em>Split</em> module and connect it to the data set.  We will configure the split module as follow:

<a href="assets/2015/8/over-fitting-neural-networks/image35.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb35.png" alt="image" width="186" height="81" border="0" /></a>

The rest can stay as is.

Basically, our data set has 200 records and we’re going to take only the first 5 (.025 or %2.5) to train a neural network and the next 195 to test.

Here I remove the “Randomized split” so you can obtain results comparable to mines.  Usually you leave that on.

As you can see I’m really setting up a gross over fitting scenario where I starve my learning algorithm, showing it only a little data.

It might seem aggressive to take only %2.5 of the data for training and it is.  Usually you would take %60 and above.  It’s just that I want to demonstrate over fitting with only 2 dimensions.  It usually occur at higher dimensions, so in order to simulate it at low dimension, I go a bit more aggressively with the training set size.

The experiment should look like this so far

<a href="assets/2015/8/over-fitting-neural-networks/image32.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb32.png" alt="image" width="459" height="333" border="0" /></a>
<h3>Learning</h3>
Let’s drop <em>Neural Network Regression</em>, <em>Train Model</em>, <em>Score Model</em> &amp; <em>Evaluate Model</em> modules on the surface and connect them like this:

<a href="assets/2015/8/over-fitting-neural-networks/image36.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb36.png" alt="image" width="479" height="368" border="0" /></a>

In the <em>Train Model</em> module we select the weight column.  This is the column we want to predict.

In the <em>Neural Network Regression</em> module, we set the number of hidden nodes to 2.

<a href="assets/2015/8/over-fitting-neural-networks/image34.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb34.png" alt="image" width="187" height="52" border="0" /></a>

To really drive the point home and increase over fitting, let’s crank the number of learning iteration to 10 000.  This will be useful when we’ll increase the number of parameters.

<a href="assets/2015/8/over-fitting-neural-networks/image37.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb37.png" alt="image" width="183" height="52" border="0" /></a>

And let’s leave the rest as is.

Let’s run the experiment.  This will train a 2-hidden nodes neural network with 5 records and evaluates it against those 5 records.

We can look at the result of <em>Evaluate Model</em> module:

<a href="assets/2015/8/over-fitting-neural-networks/image38.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb38.png" alt="image" width="463" height="182" border="0" /></a>

The metrics are <a href="https://msdn.microsoft.com/en-US/library/azure/dn906026" target="_blank">defined here</a>.  We are going to look at the <em>Relative Squared Error</em>.

The numbers you get are likely different since Neural Networks are optimized using approximation methods and randomization.  So each run might yield different results.
<h3>Testing</h3>
Now how does the model performs on data it didn’t see in its training?

Let’s drop another <em>Score Model</em> &amp; <em>Evaluate Model</em> modules and connect them like this:

<a href="assets/2015/8/over-fitting-neural-networks/image39.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb39.png" alt="image" width="476" height="310" border="0" /></a>

Basically we will compute the score, or prediction, using the same train model but on different data, on the 195 remaining records not used during testing.

We run the experiment again and we get the following results on the test evaluation:

<a href="assets/2015/8/over-fitting-neural-networks/image40.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb40.png" alt="image" width="468" height="180" border="0" /></a>

The evaluation is higher than the training data.  It nearly always is.  Let’s see how does evolve when we increase the number of hidden nodes.
<h3>Comparing with different number of nodes</h3>
We are going to compare how those metrics evolve when we change the number of parameters of the Neural Network model, i.e. the number of hidden nodes.

I do not know of a way to “loop” in AzureML.  It would be very nice if I could wrap the experiment in a loop and have the number of hidden nodes of the model vary within the loop.  If you know how to do that, please leave a comment!

Failing that, we are going to manually change the number of hidden node in the <em>Neural Network Regression </em>module.

In order to make our life easier, let’s make the reporting of the results we are looking for more straightforward than having to open the results of the two <em>Evaluate Model</em> modules.  Let’s drop another <em>Apply SQL Transformation</em> and connect it this way:

<a href="assets/2015/8/over-fitting-neural-networks/image41.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb41.png" alt="image" width="410" height="168" border="0" /></a>

and type the following SQL expression in:

<em>SELECT
t1."Relative Squared Error" AS TrainingRSE,
t2."Relative Squared Error" AS TestingRSE
FROM t1, t2</em>

We are basically taking both outputs of <em>Evaluation Model</em> modules and renaming them which gives us (after another run) the nice result:

<a href="assets/2015/8/over-fitting-neural-networks/image42.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb42.png" alt="image" width="190" height="119" border="0" /></a>

Neat, hen?

Ok, now let’s grind and manually change the hidden number of nodes a few time to fill the following table:
<table border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr style="background:lightgreen;">
<td valign="bottom" width="79"># Nodes</td>
<td valign="bottom" width="123">Training RSE</td>
<td valign="bottom" width="111">Testing RSE</td>
<td valign="bottom" width="64">Ratio</td>
</tr>
<tr>
<td valign="bottom" width="79">2</td>
<td valign="bottom" width="123">0.154358</td>
<td valign="bottom" width="111">3.270625</td>
<td valign="bottom" width="64">4.7%</td>
</tr>
<tr>
<td valign="bottom" width="79">3</td>
<td valign="bottom" width="123">0.154394</td>
<td valign="bottom" width="111">3.366281</td>
<td valign="bottom" width="64">4.6%</td>
</tr>
<tr>
<td valign="bottom" width="79">4</td>
<td valign="bottom" width="123">0.154442</td>
<td valign="bottom" width="111">3.673096</td>
<td valign="bottom" width="64">4.2%</td>
</tr>
<tr>
<td valign="bottom" width="79">5</td>
<td valign="bottom" width="123">0.154488</td>
<td valign="bottom" width="111">3.455582</td>
<td valign="bottom" width="64">4.5%</td>
</tr>
<tr>
<td valign="bottom" width="79">7</td>
<td valign="bottom" width="123">0.154612</td>
<td valign="bottom" width="111">3.835834</td>
<td valign="bottom" width="64">4.0%</td>
</tr>
<tr>
<td valign="bottom" width="79">10</td>
<td valign="bottom" width="123">0.154847</td>
<td valign="bottom" width="111">4.242703</td>
<td valign="bottom" width="64">3.6%</td>
</tr>
<tr>
<td valign="bottom" width="79">15</td>
<td valign="bottom" width="123">0.155334</td>
<td valign="bottom" width="111">4.301146</td>
<td valign="bottom" width="64">3.6%</td>
</tr>
<tr>
<td valign="bottom" width="79">20</td>
<td valign="bottom" width="123">0.155946</td>
<td valign="bottom" width="111">4.281125</td>
<td valign="bottom" width="64">3.6%</td>
</tr>
<tr>
<td valign="bottom" width="79">30</td>
<td valign="bottom" width="123">0.157558</td>
<td valign="bottom" width="111">4.222742</td>
<td valign="bottom" width="64">3.7%</td>
</tr>
<tr>
<td valign="bottom" width="79">50</td>
<td valign="bottom" width="123">0.162018</td>
<td valign="bottom" width="111">3.586147</td>
<td valign="bottom" width="64">4.5%</td>
</tr>
<tr>
<td valign="bottom" width="79">75</td>
<td valign="bottom" width="123">0.006491</td>
<td valign="bottom" width="111">3.920912</td>
<td valign="bottom" width="64">0.2%</td>
</tr>
<tr>
<td valign="bottom" width="79">100</td>
<td valign="bottom" width="123">0.006791</td>
<td valign="bottom" width="111">3.082774</td>
<td valign="bottom" width="64">0.2%</td>
</tr>
<tr>
<td valign="bottom" width="79">150</td>
<td valign="bottom" width="123">0.000025</td>
<td valign="bottom" width="111">2.544964</td>
<td valign="bottom" width="64">0.0%</td>
</tr>
<tr>
<td valign="bottom" width="79">200</td>
<td valign="bottom" width="123">0.000015</td>
<td valign="bottom" width="111">2.249117</td>
<td valign="bottom" width="64">0.0%</td>
</tr>
</tbody>
</table>
We can see that as we increased the number of parameters, the training error got lower and the testing error got higher.  At some point, the testing error start going down again, but the ratio between the two always go down.

A more visual way to look at it is to look at the actual predictions done by the models.

<a href="assets/2015/8/over-fitting-neural-networks/image44.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/over-fitting-neural-networks/image_thumb44.png" alt="image" width="481" height="425" border="0" /></a>

The green dots are the 200 points, the 5 yellow dots are the training set while the blue dots are the prediction for a Neural Network with 200 hidden nodes.

We can tell the prediction curves goes perfectly on the training points but poorly describe the entire set.
<h3>Summary</h3>
I wanted to show what over fitting could be like.

Please note that I did exaggerate a lot of elements:  the huge number of training iterations, the huge number of hidden nodes.

The main point I want you to remember is to always test your model and do not select the maximum number of parameters available automatically!

Basically over fitting is like learning by heart.  The learning algorithm learns the training set perfectly and then generalizes poorly.