require 'socket'
require 'json'
require 'matrix'

def random_bounce
  range = -50.0..50.0
  Vector[rand(range), rand(0..100.0), rand(range)]
end

@s = UDPSocket.new
@gravity = Vector[0, -9.81, 0]
@time_step = 0.016
@time_mult = 15

@pos = Vector[0, 0, 0]
@vel = random_bounce
@elapsed_time = 0.0

def step_sim(time)
  @pos += @vel * @time_mult * time
  @vel += @gravity * @time_mult * time

  if @pos[1] <= 0.0
    @pos = Vector[@pos[0], 0.0, @pos[2]]
    @vel = random_bounce
  end

  @elapsed_time += time
end

loop do
  step_sim(@time_step)
  pos = { ax: @pos[0], ay: @pos[1], az: @pos[2], t: @elapsed_time }
  @s.send(JSON.generate(pos).to_s, 0, 'localhost', 1234)
  sleep @time_step
end
