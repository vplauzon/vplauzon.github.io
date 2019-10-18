---
title:  Hyperspheres & the curse of dimensionality
date:  06/22/2017 01:23:18
permalink:  "/2017/06/21/hyperspheres-the-curse-of-dimensionality/"
categories:
- Solution
tags:
- Data
- Machine Learning
- Mathematics
---
<a href="assets/2017/6/hyperspheres-the-curse-of-dimensionality/fractal-1118515_6402.jpg"><img style="border-width:0;margin:0 10px 0 0;padding-top:0;padding-right:0;padding-left:0;float:left;display:inline;background-image:none;" title="fractal-1118515_640" src="assets/2017/6/hyperspheres-the-curse-of-dimensionality/fractal-1118515_640_thumb2.jpg" alt="fractal-1118515_640" width="320" height="240" align="left" border="0" /></a>I <a href="https://vincentlauzon.com/2015/07/02/machine-learning-an-introduction-part-1/">previously talked about the curse of dimensionality</a> (more than 2 years ago) related to Machine Learning.

Here I wanted to discuss it in more depth and dive into the mathematics of it.

High dimensions might sound like Physics’ <a href="https://en.wikipedia.org/wiki/String_theory" target="_blank" rel="noopener">string theory</a> where our universe is made of more than 4 dimensions.  <u>This isn’t what we are talking about here</u>.

The curse of dimensionality is related to what happens when a model deals with a data space with dimensions in the hundreds or thousands.

As the title of this article suggests, we’re going to take the angle of the properties of Hyperspheres (spheres in N dimensions) to explore high dimension properties.

This article is inspired by <a href="http://www.cs.cornell.edu/jeh/book11April2014.pdf" target="_blank" rel="noopener">Foundations of Data Science by John Hopcroft &amp; Ravindran Kannan</a> (chapter 2).
<h2>Why should I care about High Dimension?</h2>
When introducing Machine Learning concepts, we typically use few dimensions in order to help visualization.  For instance, when I introduced <a href="https://vincentlauzon.com/2015/07/18/azure-ml-simple-linear-regression/">linear regression</a> or <a href="https://vincentlauzon.com/2015/08/05/azureml-polynomial-sql-transformation/">polynomial regression</a> in past articles, I used datasets in two dimensions and plot them on a chart.

<img style="float:right;display:inline;" src="https://images.pexels.com/photos/53966/rabbit-palm-hand-snatch-53966.jpeg?w=940&amp;h=650&amp;auto=compress&amp;cs=tinysrgb" alt="Brown Rabbit" width="240" height="160" align="right" />In the real world, typical data sets have much more dimensions.

A typical case of high dimension is image recognition (or character recognition as a sub category) where even a low resolution pictures will have hundreds of pixels.  The corresponding model would take gray-scale input vector of dimension 100+.

<img style="margin:0 10px 0 0;float:left;display:inline;" src="https://images.pexels.com/photos/255387/pexels-photo-255387.jpeg?w=940&amp;h=650&amp;auto=compress&amp;cs=tinysrgb" alt="Close-up of an Animal Eating Grass" width="240" height="160" align="left" />With fraud detection, transactions do not contain only the value of the transaction, but the time of day, day of week, geo-location, type of commerce, type of products, etc.  .  This might or might not be a high dimension problem, depending on the available data.

In an e-commerce web site, a Product recommendation algorithm could be as simple as an N x N matrix of 0 to 1 values where N is the number of products.

With IoT, multiple sensors feed a prediction model.

In bioinformatics, DNA sequencing generates a huge amount of data which often is arranged in high dimensional model.

Basically, high dimensions crop up everywhere.
<h2>What happens as dimension increases?</h2>
For starter a space with more dimensions simply is…  bigger.  In order to sample a space with 2 dimensions with a resolution of 10 units, we need to have 10^2 = 100 points.  Having the same sampling in a space of dimension 3 would require 10^3 = 1000 points.  Dimension 20?  20 would require 10^20 = 100 000 000 000 000 000 000 points.

Right off the bat we can tell that sampling the space of dimension 2 &amp; 3 is realistic while for a space of dimension 20, it’s unlikely.  Hence we are likely going to suffer from under-sampling.

Yoshua Bengio has a nice discussion about <a href="https://www.quora.com/What-is-the-curse-of-dimensionality" target="_blank" rel="noopener">Curse of Dimensionality here</a>.
<h2>Hypersphere in a cube</h2>
<img style="float:left;display:inline;" src="https://images.pexels.com/photos/164957/pexels-photo-164957.jpeg?w=940&amp;h=650&amp;auto=compress&amp;cs=tinysrgb" alt="Tapemeasure on 20" width="240" height="160" align="left" />Beyond sampling problems, metrics &amp; <a href="https://en.wikipedia.org/wiki/Measure_(mathematics)" target="_blank" rel="noopener">measures</a> change behaviour at high dimensions.  Intuitively it makes sense since a measure takes a vector (vectors) and squeeze it (them) into a numerical value ; the higher the dimension, the more data we squeeze into one number &amp; hence we should lose information.

We use metrics &amp; measures heavily in Machine Learning.  For instance, a lot of cost (or loss) functions are based on Euclidean’s distance:
<p align="center">$latex dist(x,y) = \displaystyle\sum_{i=1}^N (x_i-y_i)^2 $</p>
Now if x and / or y are random variables (e.g. samples), the <a href="https://en.wikipedia.org/wiki/Law_of_large_numbers">law of large numbers</a> applies when N becomes <em>large</em>.  This implies the sum will trend to the expected value with a narrower standard deviation as <em>N</em> increases.  In turns, this means there is less and less information in the distance as the number of dimensions increases.

This brings us to the hypersphere.  An hypersphere’s equation is
<p align="center">$latex \displaystyle\sum_{i=1}^N x_i^2 = R^2 $</p>
where <em>x</em> is a point of dimension <em>N</em> and <em>R</em> is the radius of the hypersphere.

An hypersphere of dimension 1 is a line, an hypersphere of dimension 2 is a circle, dimension 3 is a sphere, dimension 4 is an…  expending universe?  and so on.

A theorem I’ll demonstrate in a future article is that the volume of an hypersphere of radius 1 tends to zero as the dimension increases.

UPDATE (12-07-2017):  Demonstration of hypersphere hyper volume is done in <a href="https://vincentlauzon.com/2017/07/08/hypersphere-volume/">this article</a>.

This is fairly unintuitive, so let me give real numerical values:
<table border="3" width="524">
<thead>
<tr style="background:lightblue;">
<th>Dimension</th>
<th>Hyper Volume</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td width="117">2</td>
</tr>
<tr>
<td>2</td>
<td>3.141592654</td>
</tr>
<tr>
<td>3</td>
<td>4.188790205</td>
</tr>
<tr>
<td>4</td>
<td>4.934802201</td>
</tr>
<tr>
<td>5</td>
<td>5.263789014</td>
</tr>
<tr>
<td>6</td>
<td>5.16771278</td>
</tr>
<tr>
<td>7</td>
<td>4.72476597</td>
</tr>
<tr>
<td>8</td>
<td>4.058712126</td>
</tr>
<tr>
<td>9</td>
<td>3.298508903</td>
</tr>
<tr>
<td>10</td>
<td>2.55016404</td>
</tr>
<tr>
<td>11</td>
<td>1.884103879</td>
</tr>
<tr>
<td>12</td>
<td>1.335262769</td>
</tr>
<tr>
<td>13</td>
<td width="117">0.910628755</td>
</tr>
<tr>
<td>14</td>
<td>0.599264529</td>
</tr>
<tr>
<td>15</td>
<td>0.381443281</td>
</tr>
<tr>
<td>16</td>
<td>0.23533063</td>
</tr>
<tr>
<td>17</td>
<td>0.140981107</td>
</tr>
<tr>
<td>18</td>
<td>0.082145887</td>
</tr>
<tr>
<td>19</td>
<td>0.046621601</td>
</tr>
<tr>
<td>20</td>
<td>0.025806891</td>
</tr>
<tr>
<td>21</td>
<td>0.01394915</td>
</tr>
<tr>
<td>22</td>
<td>0.007370431</td>
</tr>
<tr>
<td>23</td>
<td>0.003810656</td>
</tr>
<tr>
<td>24</td>
<td>0.001929574</td>
</tr>
<tr>
<td>25</td>
<td width="117">0.000957722</td>
</tr>
<tr>
<td>26</td>
<td>0.000466303</td>
</tr>
<tr>
<td>27</td>
<td>0.000222872</td>
</tr>
<tr>
<td>28</td>
<td>0.000104638</td>
</tr>
</tbody>
</table>
If we plot those values:

<a href="assets/2017/6/hyperspheres-the-curse-of-dimensionality/image.png"><img style="border-width:0;padding-top:0;padding-right:0;padding-left:0;display:inline;background-image:none;" title="image" src="assets/2017/6/hyperspheres-the-curse-of-dimensionality/image_thumb.png" alt="image" width="640" height="479" border="0" /></a>

We see the hyper volume increases in the first couple of dimensions.  A circle of radius 1 has an area of pi (3.1416) while a sphere of radius 1 has a volume of 4.19.  It peaks at dimension 5 and then shrinks.

It is unintuitive because in 2 and 3 dimensions (the only dimensions in which we can visualize an hypersphere), the hypersphere pretty much fills its embedding cube.  A way to “visualize” what’s happening in higher dimension is to consider a “diagonal” into an hypersphere.

For a circle, the diagonal (i.e. 45’) intersects with the unit circle at
<p align="center">$latex (\frac {1} {\sqrt {2}}, \frac {1} {\sqrt {2}})$ since $latex (\frac {1} {\sqrt {2}})^2 + (\frac {1} {\sqrt {2}})^2 = 1^2$</p>
In general, at dimension N, the diagonal intersects at
<p align="center">$latex x_i = \frac {1} {\sqrt {N}}$</p>
So, despite the hypersphere of radius 1 touches the cube of side 2 centered at the origin on each of its walls, the surface of the hypersphere, in general, gets further and further away from the cube surface as the dimension increases.
<h2>Consequences of the hypersphere volume</h2>
A straightforward consequence of the hypersphere volume is sampling.  Randomly sampling a square of side 2 centered at the origin will land points within the unit circle with probability $latex \frac{\pi}{4} = \%79$.  The same process with an hypersphere of dimension 8 would hit the inside of the hypersphere with a probability of %1.6.

A corollary to the hypersphere volume is that at higher dimension, the bulk of the volume of the hypersphere is concentrated in a thin annulus below its surface.  An obvious consequence of that is that optimizing a metric (i.e. a distance) in high dimension is difficult.
<h2>What should we do about it?</h2>
First step is to be aware of it.

A symptom of high dimensionality is under sampling:  the space covered is so large the number of sample points required to learn the underlying model are likely to be over the actual sample set’s size.

The simplest solution is to avoid high dimensionality with some pre-processing.  For instance, if we have a priori knowledge of the domain, we might be able to combine dimensions together.  For example, in an IoT field with 10 000 sensors, for many reasons, including curse of dimensionality, it wouldn’t be a good idea to consider each sensor inputs as an independent input.  It would be worth trying to aggregate out sensor inputs by analyzing the data.
<h2>Summary</h2>
Some Machine Learning algorithms will be more sensitive to higher dimensionality than others but the curse of dimensionality affects most algorithms.

It is a problem to be aware of and we should be ready to mitigate it with some good feature engineering.