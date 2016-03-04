require 'socket'
require 'json'

s = UDPSocket.new
count =0
loop do
  pos = {ax: count, ay: count, az: count, t: count}
  s.send("#{JSON.generate(pos)}", 0, 'localhost', 1234)
  sleep 0.016
  count +=1
end
