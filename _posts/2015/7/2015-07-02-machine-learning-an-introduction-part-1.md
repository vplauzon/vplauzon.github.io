---
title:  Machine Learning - An introduction - Part 1
date:  2015-07-02 10:30:27 +00:00
permalink:  "/2015/07/02/machine-learning-an-introduction-part-1/"
categories:
- Solution
tags:
- Data
- Machine Learning
---
As <a href="http://vincentlauzon.com/2015/01/12/twenty-years-of-machine-learning-at-microsoft/">I mentioned before</a>, I did specialize (through graduated studies) in Machine Learning only to drop the field after a few years of trial on the Marketplace.  I felt the field wasn't ready for prime industrial applications.

<a href="https://vincentlauzon.files.wordpress.com/2015/01/011215_0459_twentyyears1.jpg"><img class=" size-full wp-image-766 alignright" src="https://vincentlauzon.files.wordpress.com/2015/01/011215_0459_twentyyears1.jpg" alt="011215_0459_TwentyYears1.jpg" /></a>Years have past, the field has matured and now is an exciting time to be working in Machine Learning!  The possibilities have far outgrown the labs where they were born.

Yet, it still is a quite complex field being at the intersection of statistics, data analysis and, if you want to do it right, Big Data.

Before diving into <a href="http://azure.microsoft.com/en-us/services/machine-learning/" target="_blank">Azure Machine Learning</a>, I wanted to first give an overview of what Machine Learning is.  My favourite 10 minutes story is an example that is simple enough to grasp without prior ML knowledge:  few dimensions, few data points, simple ML algorithm.

In ML parlance, I'm going to give a <a href="https://en.wikipedia.org/wiki/Linear_regression" target="_blank">linear regression </a>example but you do not need to know about that to understand it.
<h3>The example</h3>
Machine learning is all about building models.  <a href="https://en.wikipedia.org/wiki/Statistical_model" target="_blank">What is a model</a>?  A model is a simplified version of reality:  it "embodies a set of assumptions concerning the generation of the observed data, and similar data from a larger population" (<a href="https://en.wikipedia.org/wiki/Statistical_model">wikipedia</a>).

In my example, we are going to predict the weight of person given its height.

We are going to build a model and that model will be able to predict the weight you should have if you measure 6 feet tall.

We already made quite a few assumptions.  We assumed the weight of a person is dependant on its height.  Written in mathematics:

<em>weight = f(height)</em>

That might remind you of a typical formulation

<em>y = f(x)</em>

But we'll go further and assume that the weight has a <strong>linear</strong> relationship (<em>y = m*x + b</em>) with the height:

<i>weight = m*height + b</i>

Now of course, this is a very simplified model, a very naïve one.  There are many reasons why you might think this model is incomplete.  First, it doesn't include a lot of variables, for instance, the age, the gender, nationality, whatever.  It's alright, it's a model.  Our goal is to make the best out of it.

Let's look at some <a href="http://wiki.stat.ucla.edu/socr/index.php/SOCR_Data_Dinov_020108_HeightsWeights" target="_blank">sample data </a>I found on the web.  I've entered the data in my #1 analysis tool, Excel, and plotted it:

<a href="assets/2015/7/machine-learning-an-introduction-part-1/image71.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image[7]" src="assets/2015/7/machine-learning-an-introduction-part-1/image7_thumb1.png" alt="image[7]" width="485" height="428" border="0" /></a>

We can see a nice cloud of data and we could guess there is sort of a linear relationship between the height and the weight.  That is, there is a line sort of carrying this cloud.  Now the question I'll ask you is:  where would you put the line?

<a href="assets/2015/7/machine-learning-an-introduction-part-1/image111.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image[11]" src="assets/2015/7/machine-learning-an-introduction-part-1/image11_thumb1.png" alt="image[11]" width="875" height="772" border="0" /></a>

I've hand drawn 4 lines.  The two bottom ones aren't very convincing, but what about the two top ones?  Which one would you choose and why?  What criteria do you use?
<h3>The mathematical problem</h3>
<em>y = m*x + b</em>:  given a <em>x</em>, we can compute a <em>y</em>.  We have an <strong>independent variable</strong>, <em>x</em>, the <em>height</em> and a <strong>dependant variable</strong>, <em>y</em>, <em>the weight</em>.

We also have <strong>parameters</strong>:  the <em>slope</em>, <em>m</em> and the <em>origin</em>, <em>b</em>.

The model is described by its parameters.  Guessing what the line should be is guessing its slope and origin.

We also have <strong>sample data</strong>:  a data set of sample <em>x</em>’s &amp; <em>y</em>’s.  We want to use that sample to deduce the parameters:

<em>parameters = F(sample data)</em>

This is the <strong>learning</strong> in <strong>Machine Learning</strong>.  We are showing examples of correct predictions to an algorithm (a machine) and we want the algorithm to figure out what is the best model to predict them all with the minimum number of errors and also to be able to predict new data it has never seen.

Simple enough?  What is the recipe?

Basically, we are going to consider many models (many values of m &amp; b) and compare them using a cost function to select <em>the best</em>.  We will use a <strong>cost function</strong> to evaluate models.

A cost function of a given model on a data set is the sum of the cost function applied to each point in the data set:

<em>Cost(model, data set) = Sum of Cost(model, point) over all points</em>

In our example, an intuitive cost function would be the distance of a sample point to the line.  After all, we want the line to be "in the thick" of the cloud, ideally (impossible here) the points should all lie on the line.  The distances is represented by the green lines on the follow graph (I’ve just plotted the first 3 data points for clarity).

<a href="assets/2015/7/machine-learning-an-introduction-part-1/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2015/7/machine-learning-an-introduction-part-1/image_thumb2.png" alt="image" width="484" height="293" border="0" /></a>

To make a story short, a more tractable cost function is the square of the distance measured on the y-axis:

<em>Cost(model, {x, y}) = (predicted(x) - x)^2</em>

If you are curious why, well, squares are easier to tackle mathematically than absolute values while yielding the same result in optimization problems.

Putting it all together, the machine learning problem is:

<em>Find m &amp; b that minimizes the sum of (m*x + b – y)^2 for all {x, y} in the data set</em>

I formulated the problem in terms of our example, but in general, a machine learning is an optimization problem:  minimizing or maximizing some function of the sample set.

It happens that the problem as stated here can be resolve by linear algebra analytically, i.e. we can find the exact solution without approximation.

I won’t give the solution since the details of the solution aren’t the point of the article.
<h3>Summary</h3>
Let’s recapitulate what we did:
<ol>
	<li>We chose a <strong>prediction</strong> we wanted to make:  predict the weight of a person</li>
	<li>We chose the <strong>independent variables</strong>, only one, the height, and the <strong>dependant variables</strong>, only one, the weight</li>
	<li>We found a <strong>sample set</strong> <em>to learn</em> from</li>
	<li>We posited a <strong>class of models</strong>:  linear regressions with slope and origin as <strong>parameters</strong></li>
	<li>We chose a <strong>cost function</strong>:  the square of the difference between sample values and predictions</li>
	<li>We <strong>optimize</strong> (minimize in this case) the sum of the cost function to find the <strong>optimal parameters</strong></li>
</ol>
We end up with the optimal values for <em>m</em> and <em>b</em>.  We therefore have our model, <em>f(x)=m*x+b</em>, and we can make prediction:  for any <em>x</em> we can predict <em>f(x)</em>, i.e. for any height we can predict the weight.

We used examples to <strong>infer rules</strong>.  This is <strong>Machine Learning</strong> in a nutshell.  We let the Machine extract information from a sample set as opposed to trying to understand the field (in this case biology I suppose) and trying to <strong>derive the rules</strong> from that understanding.

<a href="https://vincentlauzon.files.wordpress.com/2015/06/machinelearningoverview.png"><img class="aligncenter wp-image-863 size-full" src="https://vincentlauzon.files.wordpress.com/2015/06/machinelearningoverview.png" alt="MachineLearningOverview" width="469" height="196" /></a>

I hope this gave you an overview of what Machine Learning is, what type of problems it is aiming at saving and how those problems are solved.

In the next entry, I'll try to give you an idea of what more realistic Machine Learning problems look like by adding different elements to the example we have here (e.g. number of variables, complexity of the model, splitting sample data into training and test sets, etc.).

UPDATE:  <a href="http://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">See part 2 of this article</a>.