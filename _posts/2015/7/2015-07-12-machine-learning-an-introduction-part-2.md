---
title:  Machine Learning - An Introduction - Part 2
date:  2015-07-12 15:00:30 -04:00
permalink:  "/2015/07/12/machine-learning-an-introduction-part-2/"
categories:
- Solution
tags:
- Data
- Machine Learning
---
In a <a href="http://vincentlauzon.com/2015/07/02/machine-learning-an-introduction-part-1">past blog</a> entry I gave an overview of what Machine Learning is.  I showed a simple linear regression example.  The goal really was to explain to newcomer to the field what Machine Learning is, what type of problem it tries to solve and what the general approach is.

Of course, I used an extremely simple example in order to add noise to that main goal.

<a href="https://vincentlauzon.files.wordpress.com/2015/07/binary-63530_6401.jpg"><img class=" size-medium wp-image-889 aligncenter" style="height:50%;width:50%;" src="https://vincentlauzon.files.wordpress.com/2015/07/binary-63530_6401.jpg" alt="binary-63530_640[1]" /></a>

Machine Learning is about extracting information from a sample data set in order to select the optimal model (best set of parameters) fitting the sample set.

<a href="https://vincentlauzon.files.wordpress.com/2015/06/machinelearningoverview.png"><img class="aligncenter wp-image-863 size-full" src="https://vincentlauzon.files.wordpress.com/2015/06/machinelearningoverview.png" alt="MachineLearningOverview" width="469" height="196" /></a>

In this blog, I’ll give you a more complete picture by looking at different aspects of more realistic Machine Learning scenarios.
<h3><a name="learningProblems"></a>Different learning problems</h3>
We looked at one type of learning problems:  regression, i.e. predicting continuous values for dependant variables given values of independent variables.

There are at least two other popular learning problems:  classification &amp; clustering.

<img style="float:none;margin-left:auto;display:block;margin-right:auto;" src="http://cnx.org/resources/07c62da088c4fffc5bbc594390bb797369dbf269/LinearClassifier.png" alt="" />

<a href="https://en.wikipedia.org/wiki/Statistical_classification" target="_blank" rel="noopener"><strong>Classification</strong> problem</a> is a little like regression where you are trying to model <em>f</em> where <em>y = f(x)</em> but instead of having <em>y</em> being a continuous variable, <em>y</em> is discrete, i.e. takes a finite number of values, e.g. {big, small}, {unknown, male, female}, etc.  .

An example of classification problem from bioinformatics would be to take genomic scans (e.g. <a href="https://en.wikipedia.org/wiki/DNA_microarray">DNA microarray</a> results) of a patient and predict if they are prone to develop cancer (true) or not (false) based on a sample set of patients.  The dependant variable here would take a Boolean value:  {true, false}.

<a href="https://en.wikipedia.org/wiki/Cluster_analysis" target="_blank" rel="noopener"><strong>Clustering</strong> problem</a>, on the other hand, consists in predicting a class <strong>without</strong> having classes in the sample set.  Basically, the algorithms try to segment the data automatically, as opposed to learning it as in classification problems.

<img src="http://i.stack.imgur.com/UWcwJ.png" alt="" />

An example of clustering, in marketing, would be to take customer data (e.g. demographics &amp; buying habits) and ask the system to segment it into 3 groups.

There are, of course, many more learning problems.  For instance <a href="https://en.wikipedia.org/wiki/Time_series" target="_blank" rel="noopener">time series analysis</a>, where we do not look at static data but at how it varies in time.
<h3><a name="differentModels"></a>Different model classes</h3>
We looked at one class of models:  <a href="https://en.wikipedia.org/wiki/Linear_regression" target="_blank" rel="noopener">linear regression</a>.

This is a special type of <a href="https://en.wikipedia.org/wiki/Regression_analysis" target="_blank" rel="noopener">regression</a>.  This is one of the simplest algorithms but also, often the most useful.

Starting from the linear regression model, we could go non-linear, e.g. to <a href="https://en.wikipedia.org/wiki/Polynomial_regression" target="_blank" rel="noopener">polynomial</a>, so instead of having <em>f(x) = m*x + b</em>, we would have

f(x) = a_0 + a_1*x + a_2*x^2 + a_3*x^3 + … + a_n*x^n

For a given <strong>degree</strong> <em>n</em>.  The bigger the degree, the more the function can curve to fit the sample set as shown in the following examples:

<a href="assets/2015/7/machine-learning-an-introduction-part-2/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/7/machine-learning-an-introduction-part-2/image_thumb3.png" alt="image" width="966" height="852" border="0" /></a>

Another popular class of models are the <a href="https://en.wikipedia.org/wiki/Artificial_neural_network" target="_blank" rel="noopener">neural networks</a>.  They too have variable number of parameters and also have varying topology (single layer, multi-layer, deep, with feedback loops, etc.).

Classification problems give rise to different models.  A linear separator model actually borrow a lot of the conceptual of a linear regression:  imagine that a line is used not to predict points but to separate them in two categories.  Same thing could be said for a lot of regression models.

The most popular model (and the simplest) for clustering is <a href="https://en.wikipedia.org/wiki/K-means_clustering" target="_blank" rel="noopener">k-means</a>.
<h3><a name="dimensions"></a>Dimensions</h3>
Most real life problem are not about mapping one independent variable on one dependant one like we did in the <a href="http://vincentlauzon.com/2015/07/02/machine-learning-an-introduction-part-1/">previous post</a>.  There are multiple dimensions, both as independent and dependant (predicted) variables.

<strong>UPDATE (22-06-2017):  See <a href="https://vincentlauzon.com/2017/06/21/hyperspheres-the-curse-of-dimensionality/">Hyperspheres &amp; the curse of dimensionality</a> article for a detailed discussion.</strong>

<a href="https://vincentlauzon.files.wordpress.com/2015/07/hypersphere_by_enigmista1.jpg"><img class=" wp-image-892 alignleft" src="https://vincentlauzon.files.wordpress.com/2015/07/hypersphere_by_enigmista1.jpg?w=300" alt="hypersphere_by_enigmista[1]" width="400" height="300" /></a>

Multiple dimensions bring two complexities to the table:  visualization &amp; curse of dimensionality.

Having more than 2 or 3 dimensions makes visualization non trivial.  Actually, some data analysis / simple machine learning methods (e.g. linear regression) can be useful to do a first analysis on the data before choosing what type of ML model to apply to it.

Most models are geared to work in multiple dimensions.  The <a href="https://en.wikipedia.org/wiki/General_linear_model" target="_blank" rel="noopener">general linear model</a>, for instance, works in multiple dimensions.

When the number of dimension is high, a well known set of phenomena, refer to as the <a href="https://en.wikipedia.org/wiki/Curse_of_dimensionality" target="_blank" rel="noopener">curse of dimensionality</a>, occurs.  Basically, our intuition in low-dimensions (e.g. 2, 3) fails us in high dimension.

To give only one example of such phenomena, if you take an hyper-sphere of dimension <em>d</em>, the distribution of points within the sphere changes drastically as <em>d</em> increases.  With <em>d</em>=2, a circle, if you pick a point at random within the circle, the distance between the point and the center of the circle will have a very roughly uniform distribution.  When <em>d</em> increases, the volume of the hyper-sphere concentrates closer to the surface, making the distribution extremely high for distances close to the radius of the hyper-sphere and close to zero towards the middle.  Can you picture that in your head?  I can't and that's why high dimensions is tricky to work with.

A lot of techniques fail to work at high dimension because of that.
<h3><a name="testingSet"></a>Testing set</h3>
An importing activity someone wants to do with a model is to validate how optimal it is.

Since we select the optimal model for a given sample set, how much optimal can it get?  Put otherwise, how can we measure the quality of the model?

A typical way to do that is to split the available sample set in two sets:
<ul>
 	<li>A <strong>learning</strong> data set</li>
 	<li>A <strong>testing data set</strong></li>
</ul>
The learning data set is used to learn / optimize the model’s parameters while the testing data set is used to validate the output model.

The validation is often done by computing the cost function over the testing set.  This is a good way to compare two model classes, e.g. linear regression vs Neural network, to see how they each perform.  Using this kind of validation, one can actually train different class of models and select the best one overall.  Testing also allow someone to avoid over fitting, which is our next topic.
<h3><a name="overFitting"></a>Over fitting</h3>
You might have noticed I've talked about different models having varying number of parameters and the number of parameters allowing to better fit the training data?  For instance, a <a href="https://en.wikipedia.org/wiki/Polynomial_regression" target="_blank" rel="noopener">polynomial regression</a>:  a linear regression has two parameters (origin and slope), a cubic regression has 4, etc.  .

You might then wonder, why not put the maximum number of parameters in there and let it do its thing?  Yes, there is a catch.  The catch is that if you do that, you will over fit your training data set and your model will be excellent at predicting the data it has seen and terrible at doing any generalization.

As usual, it is easier to explain by showing an example.  Let's take my example from the previous article.  To make the example obvious, I'll exaggerate.  I'll take only two points from the training set (circled in green) and do a linear regression on those.

<a href="https://vincentlauzon.files.wordpress.com/2015/07/overfitting-1.png"><img class="alignnone wp-image-904 size-big-brother-logo" src="https://vincentlauzon.files.wordpress.com/2015/07/overfitting-1.png?w=459" alt="Overfitting-1" width="459" height="406" /></a>

You see how the top line fits perfectly those two points?  The distance between the points and the line is zero.  The cost function is zero.  Perfect optimization.  But you also see how poorly it predicts the other points compare to the bottom line?  The top line over fits the data.

If I did a split between a training and a test set as discussed in the previous section, I would have been able to measure the poor generalization quality.

This is actually one way to fight the over fitting:  to test the learning algorithm and select one with better generalization capacity.  For instance, I could say I'll go with polynomial regression but select the polynomial degree using the testing set.

Again, another example with a polynomial regression of high degree (say n&gt;30) fitting perfectly a few points but having poor generalization capacity.

<a href="https://vincentlauzon.files.wordpress.com/2015/07/overfitting-2.png"><img class="alignnone wp-image-905 size-big-brother-logo" src="https://vincentlauzon.files.wordpress.com/2015/07/overfitting-2.png?w=459" alt="Overfitting-2" width="459" height="406" /></a>

There are two sides at over fitting:  a large number of parameters and a low number of points in the sample set.  One can therefore either lower the number of parameters or increase the data set size, which is the next topic.

It is to be noted that a large number of parameters used with a data set containing an enormous amount of points won't over fit:  parameters will adjust and be set to zero.  A line is a special kind of cubic, for instance.
<h3><a name="size"></a>Data set size</h3>
As hinted in the <a href="#overFitting">previous topic</a>, increasing the number of points in a training data set increases the ability of the trained model to generalized.

Data set size have exploded in the last couple of years (yes, Internet basically, but also cheap storage) and that is one of the main reason for Machine Learning renaissance.

This is why combining big data with Machine Learning is <a href="http://www.datasciencecentral.com/m/blogpost?id=6448529%3ABlogPost%3A270782" target="_blank" rel="noopener">key to unleash its potential</a>.
<h3><a name="approximation"></a>Iteration / Approximation</h3>
With linear regression, we can compute an exact solution.  Most models do not allow that.  Typically we iteratively approximate a solution.  Furthermore, for any non-trivial learning problem, there are multiple local optima, which make finding the global optimum all the more difficult.

This would require an entire blog post to scratch the surface but suffice to say that you'll see a lot of notion of <strong>steps</strong> or <strong>iterations</strong> in Machine Learning models.  It has to do with the approximation methods used.

For instance, one of the way to avoid over fitting is to stop the approximation process before it reaches a local optimum.  It can be shown that this improves generalization capacity of the model.
<h3><a name="dataQuality"></a>Data Quality</h3>
I kept this one for the end, but believe me, it isn't the least.  It plagues every Machine Learning problem.

If there is one field of science where the saying <em>Rubbish In, Rubbish Out</em> applies, it is in Machine Learning.

Machine Learning models are extremely sensitive to the quality of data.

Real Data Set you take from Databases are rubbish.  They are full of missing data, data has been captured in (undocumented) different conditions and sometimes the semantic of data changes across time.

This is why a lot of the leg work in Machine Learning has little to do with Machine Learning but with Data Cleansing.

Let me give you a real example I stumble upon lately.  We were discussing an Internet of Thing (IoT) problem with a customer.  We were planning to install vibration / temperature sensor on industrial machines to monitor their manufacturing process.  We were thinking about how we could eventually leverage the collected data with Machine Learning.

The key point I made in that conversation was that it would need to be design up front into the IoT implementation.  Otherwise, I can guarantee that different sensors wouldn't be calibrated the same way and that Machine Learning models would just get lost in the fuzzy data and make poor predictions as a consequence.

The basics of Data Cleansing is to normalize the data (center it around its average and make its standard deviation equal to one), but it goes beyond that.

This is why I see Machine Learning as yet another step in the B.I. pipeline of a company:  first have your transaction data, then aggregate your data, control the quality of your data, then you can analyse and make prediction.
<h3>Summary</h3>
In the last two blog posts, I've tried to give you a taste of what Machine Learning is.  I hope it wasn't too much of a torrent of information to take in.

It is important to understand that type of basis before jumping into powerful tools such as <a href="http://azure.microsoft.com/en-us/services/machine-learning/" target="_blank" rel="noopener">Azure Machine Learning</a>.

ML is a relatively mature field with more than 30-50 years of age (depending on where you draw the line between Machine Learning, Data Analysis and Statistics), so there is a lot out there.  It is also a young field where progress are made every day.

What makes it exciting today is the capacity we have to gather data and process it so quickly!

If you would like a complementary reading, take a look at <a href="http://bit.ly/1TlqDtT" target="_blank" rel="noopener">Azure Machine Learning for Engineers</a>.  They take machine learning from a different angle and tie it immediately to concrete usage (with Azure ML).

If you have any questions, do not hesitate to punch the comment section below!

&nbsp;

<strong>UPDATE</strong>:  See all those concepts put into practice in <a href="http://vincentlauzon.com/2015/07/18/azure-ml-simple-linear-regression/">Azure ML – Simple Linear Regression</a>.